/*
 * @Author:廖培坚
 * @Date: 2021-07-08 11:03:58
 * @LastEditTime: 2022-01-17 14:46:55
 * @LastEditors: 羊驼
 * @Description: 封装jointJs方法
 * @FilePath: \vue-admin-teaching-management-platform\src\views\pharmaceutical-marketing\src\jointJsTool.js
 */
import { BlockType, Block, TriggerInfo, ProcessInfo } from './struct'
import { MessageBox, Message } from 'element-ui'

let ipcRenderer;
try {
    ipcRenderer = window.require("electron").ipcRenderer;
} catch (e) { }


let defaultLinkOption = {   //连线的设置
    connector: { name: "rounded", args: { radius: 5 } },
    router: { name: "metro" },
    startDirections: ["right"],
    endDirections: ["left"],
    attrs: {
        line: {
            connection: true,
            stroke: '#fff',
            strokeWidth: 2,
            smooth: true,
            targetMarker: {
                type: 'path',
                fill: '#fff',
                stroke: 'none',
                // d: 'M 7.5 -10 2.5 -10 2.5 10 7.5 10 Z   M 17.5 -10 12.5 -10 12.5 10 17.5 10 Z   M 40 -10 20 0 40 10 Z'
            }
        }
    }
}
let circleLinkOption = {
    attrs: {
        line: {
            connection: true,
            stroke: '#fff',
            strokeWidth: 2,
            smooth: true,
            targetMarker: {
                'type': 'circle',
                'r': 5,
            },
            sourceMarker: {
                'type': 'circle',
                'r': 5,
            },
        }
    }

}

import { shapes } from 'jointjs'
import store from '../store/index.js'

const state = store.state


// 流程图高度
let height = 4000
let width = 4000
let tools = null
class JointClass {
    vue = null
    graph = null
    paper = null
    nodes = []
    lines = []
    box = null
    mustNode = []
    currentDragPositionChange = false
    pointTarget = null
    constructor(v) {
        this.vue = v
        tools = this
        this.initPaper()
        this.initLinkTools()
        this.initElementTools()
        this.defineBox()
        this.initFlowBlock()
        this.initShortCutEvent()
    }

    //#region 初始化函数

    /**
     * @description: 初始化画布
     * @param {*}
     * @return {*}
     */
    initPaper() {
        let graph = new joint.dia.Graph([], {
            cellNamespace: shapes
        });
        let paper = new joint.dia.Paper(this.getPaperOptions(graph));
        var paperSmall = new joint.dia.Paper({
            el: $("#myholder-mini"),
            width: 150,
            height: 150,
            model: graph,
            drawGrid: {
                name: 'mesh',
                args: { color: '#555', thickness: 1 }
            },
            gridSize: 1,
            background: {
                color: '#2A2A2A'
            },
            interactive: false
        });
        paperSmall.scale(0.05);
        [this.paper, this.graph] = [paper, graph];
        this.initPaperEvent()
    }

    /**
     * @description: 初始化元素工具按钮
     * @param {*}
     * @return {*}
     */
    initElementTools() {
        let _this = this
        var removeButton = new joint.elementTools.Remove({
            action: function () {
                _this.removeTips(false, this.model.id)
            }
        });
        var elementTools = new joint.dia.ToolsView({
            tools: [
                removeButton
            ]
        });
        this.paper.on('element:mouseenter', function (elementView) {
            let model = elementView.model.attributes.index
            if (model == undefined) {
                elementView.addTools(elementTools);
            }

        });

        this.paper.on('element:mouseleave', function (elementView) {
            let model = elementView.model.attributes.index
            if (model == undefined) {
                elementView.removeTools();
            }

        });
    }

    /**
     * @description: 获取画布配置
     * @param {*} graph
     * @return {*}
     */
    getPaperOptions(graph) {
        setTimeout(() => {
            let grid = $('.joint-paper-grid').get(0)
            grid.style.height = height + 'px'
            grid.style.width = width + 'px'
            grid.classList.add('grid-normal')
            $('#myholder svg').css({ position: "relative", "z-index": '1' })
        }, 500)


        return {
            el: $("#myholder"),
            cellViewNamespace: shapes,
            width,
            height,
            model: graph,
            drawGrid: {
                name: 'mesh',
                args: { color: '#555', thickness: 1 }
            },
            gridSize: 20,
            background: {
                color: '#2A2A2A'
            },
            restrictTranslate: true,
            perpendicularLinks: true,
            restrictTranslate: true,
            validateConnection: function (cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
                let source = cellViewS.model
                let target = cellViewT.model
                if (source == target) return false
                let sourceData = source.attributes.data
                let targetData = target.attributes.data
                if (targetData) {
                    if ((sourceData.mtype == targetData.mtype) && (sourceData.mtype < 2)) return false
                    if ((sourceData.mtype > targetData.mtype)) return false
                    if (sourceData.mtype == 0 && targetData.mtype == 2) return false
                }
                return true
            },
            defaultLink: new joint.shapes.standard.Link(defaultLinkOption),
            markAvailable: true
        }
    }

    /**
     * @description: 快捷键事件监听
     * @param {*}
     * @return {*}
     */
    initShortCutEvent() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault()
            let pointTarget = this.pointTarget
            // 删除快捷键
            if (e.key == 'Delete' && pointTarget) {
                let isLink = pointTarget.model.isLink()
                this.removeTips(isLink, pointTarget.model.id)
            }
            // 保存快捷键
            if (e.altKey && e.key == 's') {
                this.saveData()
            }

            // 克隆快捷键
            if (e.altKey && e.key == 'd' && pointTarget) {
                this.cloneNode(pointTarget)
            }

            // 插入子节点快捷键
            if (e.key == 'Insert' && pointTarget) {
                this.insertChildNode(pointTarget)
            }
        })
    }


    /**
     * @description: 初始化纸张事件
     * @param {*}
     * @return {*}
     */
    initPaperEvent() {
        let [ex, ey] = [0, 0]
        let frame = $('.frame')

        // blank事件集合
        this.paper.on(
            {
                'blank:pointerdown': (evt, x, y) => {
                    this.vue.setMenu(false)
                    $('#myholder').css("cursor", "grab")
                    ex = evt.offsetX
                    ey = evt.offsetY
                    frame.on('mousemove', evt => {
                        let scrollLeft = frame.scrollLeft() + (ex - evt.offsetX);
                        let scrollTop = frame.scrollTop() + (ey - evt.offsetY);
                        scrollLeft = 0 > scrollLeft ? 0 : scrollLeft;
                        scrollTop = 0 > scrollTop ? 0 : scrollTop;
                        frame.scrollTop(scrollTop).scrollLeft(scrollLeft)
                    });
                },
                "blank:pointermove": (evt, x, y) => {
                    $('#myholder').css("cursor", "grab");
                },
                'blank:pointerup': (evt, x, y) => {
                    $('#myholder').css("cursor", "default")
                    frame.off('mousemove')
                    state.tabs.forEach((item) => {
                        if (item.name != '') {
                            item.edit = false
                        }
                    })
                },
                'blank:contextmenu': (evt, x, y) => {
                    let frame = $('.frame')
                    let left = (evt.offsetX) - frame.scrollLeft() + 'px'
                    let top = evt.offsetY - frame.scrollTop() + 30 + 'px'
                    this.vue.setMenu(true, left, top)
                    let _this = this
                    _this.vue.cache = {
                        x: evt.offsetX,
                        y: evt.offsetY,
                        width: 150,
                        height: 50,
                        form: {}
                    }
                    let event = function (e) {
                        if (e.target.getAttribute('ban')) {
                            return
                        }
                        _this.vue.setMenu(false)
                        window.removeEventListener('click', event)
                    }
                    window.addEventListener('click', event)
                },
                'blank:mousewheel': (evt, x1, y2, delta) => {
                    evt.preventDefault()
                    const { sx, sy } = this.paper.scale();
                    let scale = sx + (delta > 0 ? 0.1 : -0.1)
                    scale = scale < 0.4 ? 0.4 : scale > 1.4 ? 1.4 : scale
                    this.paper.scale(scale)
                },
            })


        // cell 事件
        this.paper.on({
            'cell:pointermove': (cellView, evt, x, y) => {
                this.currentDragPositionChange = true
            },
            'cell:pointerup': (cellView, evt, x, y) => {
                if (!this.currentDragPositionChange) {
                    let data = cellView.model.attributes.data
                    this.vue.currentForm = data
                    this.vue.drawer = true
                }
                this.currentDragPositionChange = false
                let model = cellView.model
                if (!cellView.targetMagnet && model.isLink()) {
                    model.remove()
                }
                else if (cellView.targetMagnet) {
                    let target = cellView.targetView.model
                    let source = cellView.sourceView.model
                    if (this.haveConnectTarget(source, target)) {
                        return model.remove()
                    }
                    this.createLink(source, target, model)
                    this.setTargetID('create', source.attributes.data, target.id, target.attributes.data)
                }
            },
            'cell:mouseenter': (cell, evt, x, y) => {
                cell.model.attr("body/filter", {
                    name: 'highlight',
                    args: {
                        color: 'red',
                        width: 1,
                        opacity: 1,
                        blur: 5
                    }
                })
                this.pointTarget = cell

            },
            'cell:mouseleave': (cell, evt, x, y) => {
                cell.model.removeAttr("body/filter")
                this.pointTarget = null
            },
            'cell:contextmenu': (cell, evt, x, y) => {
                let line = cell.model.isLink()
                this.removeTips(line, cell.model.id)
            }
        })

    }

    /**
     * @description: 自定义元素
     * @param {*}
     * @return {*}
     */
    defineBox() {

        let markup = [{
            tagName: "rect",
            selector: "body"
        }, {
            tagName: "rect",
            selector: 'header'
        }, {
            tagName: "text",
            selector: "title"
        }, {
            tagName: "text",
            selector: "content"
        }]
        let attrs = {
            body: {
                fill: '#212524',
                refWidth: '100%',
                refHeight: '100%',
                strokeWidth: 1,
                stroke: '#20221F',
                rx: 10,
                ry: 10,
                cursor: "pointer",
                magnet: true
            },
            header: {
                cursor: "pointer",
                refWidth: '99%',
                height: 30,
                refX: '0.5%',
                refY: '1%',
                fill: {
                    type: 'linearGradient',
                    stops: [
                        { offset: '0%', color: '#5683A0' },
                        { offset: '50%', color: '#3F5A6D' },
                        { offset: '95%', color: '#3E4B52' }
                    ]
                },
                rx: 10,
                ry: 5,
            },
            title: {
                "x-alignment": "middle",
                fill: "#fff",
                refX: '50%',
                refY: 10,
                height: 30,
                fontSize: 14,
                textWrap: {
                    text: "节点",
                    width: -30, // reference width minus 10
                    height: 30, // half of the reference height
                    ellipsis: true, // could also be a custom string, e.g. '...!?'
                    refY: "10%",
                },
            },
            content: {
                fill: "#fff",
                refX: '10%',
                refWidth: '85%',
                refY: '40%',
                fontSize: 14,
                cursor: "pointer",
                textWrap: {
                    text: "测试",
                    width: -30, // reference width minus 10
                    height: '75%', // half of the reference height
                    ellipsis: true, // could also be a custom string, e.g. '...!?'
                    refY: "20%"
                },
            }
        }
        // 流程的基础模块
        joint.dia.Element.define('html.block', {
            attrs
        }, {
            markup
        })
        attrs.header.fill.stops = [
            { offset: '0%', color: '#871718' },
            { offset: '50%', color: '#622726' },
            { offset: '95%', color: '#5F4542' }
        ]
        joint.dia.Element.define('html.trigger', {
            attrs
        }, {
            markup
        })
        attrs.header.fill.stops = [
            { offset: '0%', color: '#00CD66' },
            { offset: '50%', color: '#00CD66' },
            { offset: '95%', color: '#008B45' }
        ]
        joint.dia.Element.define('html.process', {
            attrs
        }, {
            markup
        })
    }


    /**
     * @description: 初始化线的工具
     * @param {*}
     * @return {*}
     */
    initLinkTools() {
        var verticesTool = new joint.linkTools.Vertices();
        var boundaryTool = new joint.linkTools.Boundary();
        let _this = this
        var removeButton = new joint.linkTools.Remove({
            action: function () {
                _this.removeTips(true, this.model.id)
            }
        });
        let toolsView = new joint.dia.ToolsView({
            tools: [
                verticesTool, boundaryTool, removeButton
            ]
        });
        this.paper.on('link:mouseenter', (linkView) => {
            linkView.addTools(toolsView);
        });

        this.paper.on('link:mouseleave', (linkView) => {
            linkView.removeTools();
        });
    }

    /**
     * @description: 初始化节点
     * @param {*}
     * @return {*}
     */
    initFlowBlock() {
        this.mustNode = []
        this.nodes = []
        this.lines = []
        var rect = this.getTypeRect(0, 100, 100)
        let main = this.getStruct(BlockType.普通节点)
        main.id = rect.id
        main.blockName = "流程入口"
        rect.attr("title/textWrap/text", "主流程节点")
        rect.attr("content/textWrap/text", "流程入口")
        rect.prop("data", main)
        rect.prop("mtype", 0)

        var rect2 = this.getTypeRect(1, 100, 300)

        let process = this.getStruct(BlockType.流程节点)
        process.id = rect2.id

        rect2.prop("data", process)
        rect2.prop("mtype", 1)
        rect2.attr("title/textWrap/text", "流程节点")
        rect2.attr("content/textWrap/text", "请编写流程初始化触发节点")
        process.process = "请编写流程初始化触发节点"
        let link = new joint.shapes.standard.Link(defaultLinkOption)
        link.source(rect)
        link.target(rect2)
        this.setTargetID("create", main, "", process)
        this.graph.addCells([rect, rect2, link])
        this.nodes.push(rect, rect2)
        this.mustNode.push(rect.id, rect2.id)
        this.lines.push({
            target: process,
            source: main,
            model: link,
        })

    }

    //#endregion


    //#region 节点处理

    /**
     * @description: 是否是必须的节点
     * @param {*} id
     * @return {*}
     */
    mustNodeExist(id) {
        return this.mustNode.includes(id)
    }


    /**
     * @description:  获取节点下的data
     * @param {*} id
     * @return {*}
     */
    findNode(id) {
        return this.graph.getCell(id)?.attributes.data
    }

    /**
     * @description: 拖拽后重新渲染正确节点顺序
     * @param {*} fatherID 父节点的id
     * @param {*} oldIDs 拖拽前的id
     * @return {*}
     */
    changeNodeData(fatherID, oldIDs) {
        let father = this.findNode(fatherID)
        let type = father.mtype == 0 ? 'process' : 'triggersInfo'
        father[type].forEach((item, index) => {
            item.id = oldIDs[index]
            let node = this.graph.getCell(item.id)
            this.renderNode(node, item)
        })
    }

    /**
     * @description: 创建节点
     * @param {*} type 节点类型
     * @param {*} x x坐标
     * @param {*} y y坐标
     * @param {*} form 节点要保存的数据结构
     * @return {*}
     */
    createNode(type, x, y, form) {
        let node = null
        node = this.getTypeRect(type, x, y);
        form.id = node.id
        node.prop('mtype', type)
        this.renderNode(node, form)
        node.addTo(this.graph)
        this.nodes.push(node)
        return node
    }

    /**
     * @description: 根据数据结构渲染节点内容
     * @param {*} node 节点实例
     * @param {*} form 结构
     * @return {*}
     */
    renderNode(node, form) {
        let name = ""
        let content = ""
        let FuncType = store.state.FuncType
        switch (form.mtype) {
            case BlockType.普通节点:
                name = "主流程节点"
                content = form.blockName
                break;
            case BlockType.流程节点:
                name = "流程节点"
                content = form.process
                break;
            case BlockType.触发器节点:
                name = "触发器节点"
                FuncType.some((item) => {
                    if (!isNaN(parseInt(form.funcType))) {
                        if (form.funcType == item.value) {
                            content = item.name
                            return item
                        }
                    }
                })
                break;
        }
        node.prop('data', form)
        node.attr("title/textWrap/text", name)
        node.attr("content/textWrap/text", content)
    }


    /**
     * @description: 克隆节点
     * @param {*} target
     * @return {*}
     */
    cloneNode(target) {
        let attributes = target.model.attributes
        let mtype = attributes.mtype
        if (mtype) {
            let data = attributes.data
            let { x, y } = attributes.position
            let struct = this.getStruct(mtype)
            switch (mtype) {
                case BlockType.流程节点:
                    struct.process = data.process
                    break;
                case BlockType.触发器节点:
                    struct.tag = data.tag
                    struct.userTip = data.userTip
                    struct.triggerType = data.triggerType
                    struct.funcType = data.funcType
                    struct.funcArgs = data.funcArgs
                    break;
            }
            this.createNode(mtype, x + 250, y, struct)
        }
    }

    /**
     * @description: 快速插入子节点
     * @param {*} target
     * @return {*}
     */
    insertChildNode(node) {
        let attributes = node.model.attributes
        let mtype = attributes.mtype
        if (mtype >= 0) {
            let { x, y } = attributes.position
            let target = null
            let form = null
            switch (mtype) {
                case BlockType.普通节点:
                    form = this.getStruct(BlockType.流程节点)
                    break;
                case BlockType.流程节点:
                case BlockType.触发器节点:
                    form = this.getStruct(BlockType.触发器节点)
                    break;
            }
            target = this.createNode(form.mtype, x + 250, y, form)
            let source = node.model
            this.createLink(source, target, null)
            this.setTargetID('create', source.attributes.data, target.id, target.attributes.data)
        }
    }


    /**
     * @description: 删除节点
     * @param {*} id
     * @return {*}
     */
    removeNode(id) {
        try {
            let index = -1
            if (this.mustNode.includes(id)) {
                return Message.error("无法删除必要的节点")
            }
            this.nodes.some((item, i) => {
                if (item.id == id) {
                    index = i
                    return item
                }
            })
            if (index != -1) {
                state.save = false
                let model = this.nodes[index]
                if (this.vue.currentForm && model.id == this.vue.currentForm.id) {
                    this.vue.currentForm = null
                }
                let data = model.attributes.data
                if (data.mtype == 1) {
                    let lastIndex = -1
                    let nextIndex = -1
                    let father = this.findNode(data.fatherNode)
                    father?.process.some((item, index) => {
                        if (item.id == data.id) {
                            lastIndex = index - 1
                            nextIndex = (index + 1) > father.process.length - 1 ? -1 : index + 1
                            return item
                        }
                    })
                    if (lastIndex != -1 && nextIndex != -1) {
                        let line = new joint.shapes.standard.Link(defaultLinkOption)
                        let last = this.graph.getCell(father.process[lastIndex].id)
                        let next = this.graph.getCell(father.process[nextIndex].id)
                        line.target(next)
                        line.source(last)
                        line.addTo(this.graph)
                        this.lines.push({
                            target: next.attributes.data,
                            source: father,
                            model: line
                        })
                    }
                }

                this.clearLineWithRemoveNode(id)
                model.remove()
                this.nodes.splice(index, 1)
            }
        } catch (e) {
            console.log(e);
        }
    }

    //#endregion

    //#region  连线处理

    /**
     * @description: 查询是否已经有了连接
     * @param {*} source 源对象
     * @param {*} target 目标对象
     * @return {*}
     */
    haveConnectTarget(source, target) {
        let links = this.lines
        for (let i = 0; i < links.length; i++) {
            let targetID = links[i].target.id
            let sourceID = links[i].source.id
            if (source.id == sourceID && targetID == target.id) {
                return true
            }
        }
        return false
    }

    /**
     * @description: 连线逻辑的处理
     * @param {*} source 源对象
     * @param {*} target 目标对象
     * @param {*} model  线的实例
     * @return {*}
     */
    createLink(source, target, model) {
        let sourceData = source.attributes.data
        switch (sourceData.mtype) {
            case BlockType.普通节点:
                if (sourceData.process.length > 0) {
                    model?.remove()
                    let node = this.graph.getCell(sourceData.process[sourceData.process.length - 1].id)
                    model = new joint.shapes.standard.Link(defaultLinkOption)
                    model.target(target)
                    model.source(node)
                    model.addTo(this.graph)
                }
                break;
            case BlockType.流程节点:
                model?.remove()
                model = new joint.shapes.standard.Link(circleLinkOption)
                model.target(target)
                model.source(source)
                model.addTo(this.graph)
                break;
        }
        target.attributes.data.fatherNode = sourceData.id
        this.lines.push({
            target,
            source,
            model,
        })
    }

    /**
     * @description: 设置连接成功后的数据处理
     * @param {*} mode create or remove 创建或移除
     * @param {*} source 源数据
     * @param {*} id 对象id 
     * @param {*} target 对象实例
     * @return {*}
     */
    setTargetID(mode, source, id, target = null) {
        try {
            state.save = false
            let removeArray = []
            switch (source.mtype) {
                case BlockType.普通节点:
                    target && source.process.push(target)
                    removeArray = source.process
                    break;
                case BlockType.流程节点:
                    target && source.triggersInfo.push(target)
                    removeArray = source.triggersInfo
                    break;
                case BlockType.触发器节点:
                    source.nextTrigger = target
                    break;
            }
            if (mode == 'remove') {
                removeArray.some((item, i) => {
                    if (item.id == id) {
                        return removeArray.splice(i, 1)
                    }
                })

            }
        } catch (e) {
            console.log(e);
        }

    }


    /**
     * @description: 当删除点之前 要清除和节点存在关联的targetid
     * @param {*} id
     * @return {*}
     */
    clearLineWithRemoveNode(id) {
        try {
            for (let i = 0; i < this.lines.length; i++) {
                let item = this.lines[i]
                let target = item.target.attributes
                let source = item.source.attributes
                if (target?.id == id) {
                    this.setTargetID('remove', source.data, id, null)
                    this.lines.splice(i--, 1)
                }
                if (source?.id == id) {
                    this.lines.splice(i--, 1)
                }
            }
        } catch (e) {
            console.log(e);
        }

    }

    /**
     * @description: 删除线
     * @param {*} id
     * @return {*}
     */
    removeLine(id) {
        for (let i = 0; i < this.lines.length; i++) {
            let item = this.lines[i]
            if (item.model.id == id) {
                try {
                    if (this.mustNode.includes(item.target.id) && this.mustNode.includes(item.source.id)) {
                        return Message.error("不能删除两个都是必要节点的连接")
                    }
                    state.save = false
                    this.removeLineHandle(item.target)
                    item.model.remove()
                    this.lines.splice(i, 1)
                }
                catch (e) {
                    console.log(e);
                }
                break;
            }
        }
    }

    /**
     * @description: 删除线的时候 需要执行的句柄
     * @param {*} target
     * @return {*}
     */
    removeLineHandle(target) {
        let data = target.attributes.data
        let father = this.findNode(data.fatherNode)
        switch (data.mtype) {
            case BlockType.流程节点:
                let index = -1
                let removeID = new Set()
                father.process.forEach((item, i) => {
                    if (item.id == data.id) {
                        index = i
                    }
                    if (index != -1) {
                        removeID.add(item.id)
                    }
                })
                let links = this.lines
                for (let i = 0; i < links.length; i++) {
                    let line = links[i]
                    if (removeID.has(line.target.id)) {
                        line.model.remove()
                        links.splice(i--, 1)
                    }
                }
                father.process = father.process.slice(0, index)
                break;
            case BlockType.触发器节点:
                this.arrayRemove(father.triggersInfo, data.id)
                break;
        }
    }



    /**
     * @description: 删除数组指定id
     * @param {*} data
     * @param {*} id
     * @return {*}
     */
    arrayRemove(data, id) {
        for (let i = 0; i < data.length; i++) {
            let item = data[i]
            if (item.id == id) {
                return data.splice(i, 1)
            }
        }
    }

    //#endregion

    //#region 功能性函数

    /**
     * @description: 删除物体的弹窗提示
     * @param {*} line
     * @param {*} id
     * @return {*}
     */
    removeTips(line, id) {
        MessageBox.confirm(`此操作将永久删除该${!line ? '节点' : '连接'}, 是否继续?`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            if (line) {
                this.removeLine(id)
            } else {
                this.removeNode(id)
            }
        }).catch(() => {

        })
    }

    /**
     * @description: 导出unity数据
     * @param {*}
     * @return {*}
     */
    exportUnityData() {
        let flowData = this.createExportData()
        this.createExport(flowData)
    }

    /**
     * @description: 导出流程图数据
     * @param {*}
     * @return {*}
     */
    saveData() {
        let { tabs, currentTab, FuncType, events } = state
        tabs[currentTab].data = this.getSaveData()
        let item = {
            tabs,
            currentTab,
            FuncType,
            events,
            tagList
        }

        if (state.file && state.file.path) {
            state.save = true
            ipcRenderer.send("saveData", {
                path: state.file.path,
                data: item
            })
        } else {
            if (ipcRenderer) {
                state.save = true
                ipcRenderer.send("saveFile", JSON.stringify(item))
            } else {
                this.createExport(item)
            }
        }
    }

    /**
     * @description: 创建导出
     * @param {*} data
     * @return {*}
     */
    createExport(data) {
        var elementA = document.createElement("a");
        //文件的名称为时间戳加文件名后缀
        elementA.download = +new Date() + ".json";
        elementA.style.display = "none";
        //生成一个blob二进制数据，内容为json数据
        var blob = new Blob([JSON.stringify(data)])
        //生成一个指向blob的URL地址，并赋值给a标签的href属性
        elementA.href = URL.createObjectURL(blob);
        document.body.appendChild(elementA);
        elementA.click();
        document.body.removeChild(elementA);
    }

    /**
     * @description: 创建导出的结构
     * @param {*}
     * @return {*}
     */
    createExportData() {
        let { tabs, currentTab } = state
        tabs[currentTab].data = this.getSaveData()
        // 重新绑定指针关系 否则指针不变 数组不会收到影响
        for (let i = 0; i < tabs.length; i++) {
            let block = tabs[i].data.cells[0].data
            let map = new Map()
            for (let j = 1; j < tabs[i].data.cells.length; j++) {
                let target = tabs[i].data.cells[j].data
                if (target) {
                    map.set(target.id, target)
                }
            }
            for (let j = 0; j < block.process.length; j++) {
                let item = block.process[j]
                if (map.has(item.id)) {
                    block.process[j] = map.get(item.id)
                    block.process[j].triggersInfo.forEach((trigger, index) => {
                        if (map.has(trigger.id)) {
                            block.process[j].triggersInfo[index] = map.get(trigger.id)
                        }
                    })
                }
            }
        }
        let blockDatas = {
            startBlock: tabs[0].data.cells[0].data,
            blocks: [],
            items: state.events
        }
        for (let i = 1; i < tabs.length; i++) {
            blockDatas.blocks.push(tabs[i].data.cells[0].data)
        }
        return blockDatas
    }

    /**
     * @description: 获取当前流程图转json的数据
     * @param {*}
     * @return {*}
     */
    getSaveData() {
        return this.graph.toJSON()
    }


    /**
     * @description: 读取数据 从文件读取
     * @param {*}
     * @return {*}
     */
    async loadData() {
        let data = await new Promise((resolve, reject) => {
            let input = document.createElement('input');
            input.value = '选择文件';
            input.type = 'file';
            input.onchange = event => {
                let file = event.target.files[0];
                let file_reader = new FileReader();
                store.commit("setFile", file)
                if (ipcRenderer) {
                    ipcRenderer.send("saveLastEdit", file.path)
                }
                file_reader.onload = () => {
                    let fc = file_reader.result;
                    resolve(fc); // 返回文件文本内容到Promise
                };
                file_reader.readAsText(file, 'UTF-8');
            };
            input.click();
        });
        this.loadFromData(data)
    }

    loadFromData(data) {
        try {
            data = JSON.parse(data)
            let { tabs, currentTab, FuncType, events } = data
            state.tabs = tabs
            state.currentTab = currentTab
            state.FuncType = FuncType
            state.events = events
            this.writeData(tabs[state.currentTab].data)
            state.save = true
        } catch (err) {
            this.newFlow()
            Message.error("打开失败 格式有误")
            console.log(err);
        }

    }

    /**
     * @description: 新建流程
     * @param {*}
     * @return {*}
     */
    newFlow() {
        this.clearTable()
        this.initFlowBlock()
        state.tabs = [
            {
                fixed: true,
                edit: false,
                name: "主流程",
                data: [],
            },
        ];
        state.currentTab = 0
        state.FuncType = []
        state.events = []
        state.file = null
        state.save = true
        state.tagList = []
        if (ipcRenderer) {
            ipcRenderer.send("saveLastEdit", "")
        }
    }

    /**
     * @description: 写入数据到流程图
     * @param {*} flowData
     * @return {*}
     */
    writeData(flowData) {
        this.clearTable()
        this.graph.fromJSON(flowData)
        this.nodes = this.graph.getElements()
        this.graph.getLinks().forEach((item) => {
            let source = this.graph.getCell(item.source().id)
            let target = this.graph.getCell(item.target().id)
            this.lines.push({
                source,
                target,
                model: item
            })
        })
        for (let i = 0; i < this.nodes.length; i++) {
            let item = this.nodes[i]
            if (item.attributes.index != undefined) {
                this.nodes.splice(i--, 1)
            }
        }
        this.mustNode.push(this.nodes[0], this.nodes[1])
    }


    /**
     * @description: 清除流程图
     * @param {*}
     * @return {*}
     */
    clearTable() {
        this.nodes = []
        this.lines = []
        this.mustNode = []
        this.graph.clear();
    }

    /**
     * @description: 获取节点对应的结构
     * @param {*} type
     * @return {*}
     */
    getStruct(type) {
        let obj = {}
        switch (type) {
            case BlockType.普通节点:
                obj = new Block()
                break;
            case BlockType.流程节点:
                obj = new ProcessInfo()
                break;
            case BlockType.触发器节点:
                obj = new TriggerInfo()
        }
        return obj
    }

    /**
     * @description: 获取流程图的节点实例
     * @param {*} type
     * @param {*} x
     * @param {*} y
     * @return {*}
     */
    getTypeRect(type, x, y) {
        let block = ""
        switch (type) {
            case BlockType.普通节点:
                block = "block"
                break;
            case BlockType.流程节点:
                block = 'process'
                break;
            case BlockType.触发器节点:
                block = "trigger"
                break
        }
        let rect = new joint.shapes.html[block](
            {
                position: { x, y },
                size: { width: 200, height: 100 },
            }
        )
        return rect
    }

    //#endregion


}


export default {
    JointClass,
}