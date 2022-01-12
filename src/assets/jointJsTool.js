/*
 * @Author:廖培坚
 * @Date: 2021-07-08 11:03:58
 * @LastEditTime: 2022-01-12 17:24:08
 * @LastEditors: 羊驼
 * @Description: 封装jointJs方法
 * @FilePath: \vue-admin-teaching-management-platform\src\views\pharmaceutical-marketing\src\jointJsTool.js
 */
import { BlockType, Block, TriggerInfo, ProcessInfo, FuncType } from './struct'
import { MessageBox, Message } from 'element-ui'
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
import { data } from 'jquery'
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
    edit = false
    save = true
    constructor(v) {
        this.vue = v
        tools = this
        this.initPaper()
        this.initLinkTools()
        this.initElementTools()
        this.defineBox()
        this.initFlowBlock()
    }


    // 初始化画布
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

    // 初始化删除按钮
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



    // 获取画布配置
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

    // 查询是否已经有了连接
    haveConnectTarget(id) {
        return this.lines.some((item) => {
            if (item.source.id == id) {
                return true
            }
        })
    }

    // 自定义元素
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


    // 初始化线的工具
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
        this.setTargetID("create", 0, main, "", process)
        this.graph.addCells([rect, rect2, link])
        this.nodes.push(rect, rect2)
        this.mustNode.push(rect.id, rect2.id)
        this.lines.push({
            target: process,
            source: main,
            model: link,
        })

    }

    // 初始化纸张事件
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
                    this.vue.tabs.forEach((item) => {
                        item.edit = false
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
            'cell:pointerup': (cellView, evt, x, y) => {
                let model = cellView.model
                if (!cellView.targetMagnet && model.isLink()) {
                    model.remove()
                }
                else if (cellView.targetMagnet) {
                    let target = cellView.targetView.model
                    let source = cellView.sourceView.model
                    this.createLink(source, target, model)
                    this.setTargetLink(source, target.attributes.data.id)
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
            },
            'cell:pointerdblclick': (cell, evt, x, y) => {
                // let data = cell.model.attributes.data
                // if (!this.mustNode.includes(data.id) || data.mtype > 0) {

                // } else {
                //     Message.error("入口节点不能操作")
                // }
                this.vue.currentForm = cell.model.attributes.data
                this.vue.drawer = true
            },
            'cell:mouseleave': (cell, evt, x, y) => {
                cell.model.removeAttr("body/filter")
            },
            'cell:contextmenu': (cell, evt, x, y) => {
                let line = cell.model.isLink()
                this.removeTips(line, cell.model.id)
            }
        })

    }

    //TODO 根据类型去创建连线位置
    createLink(source, target, model) {
        let sourceData = source.attributes.data
        switch (sourceData.mtype) {
            case BlockType.普通节点:
                if (sourceData.process.length > 0) {
                    model.remove()
                    let node = this.findNode(sourceData.process[sourceData.process.length - 1].id)
                    model = new joint.shapes.standard.Link(defaultLinkOption)
                    model.target(target)
                    model.source(node)
                    model.addTo(this.graph)
                }
                break;
            case BlockType.流程节点:
                model.remove()
                model = new joint.shapes.standard.Link(circleLinkOption)
                model.target(target)
                model.source(source)
                model.addTo(this.graph)
                break;
        }
        this.lines.push({
            target,
            source,
            model,
        })
    }

    // 删除弹窗提示
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

    // 查找节点
    findNode(id) {
        let nodes = this.nodes
        for (let i = 0; i < nodes.length; i++) {
            let item = nodes[i]
            if (item.id == id) {
                return item
            }
        }
    }

    // 创建节点
    createNode(type, x, y, form) {
        let node = null
        node = this.getTypeRect(type, x, y);
        form.id = node.id
        node.prop('mtype', type)
        this.renderNode(node, form)
        node.addTo(this.graph)
        this.nodes.push(node)
    }

    renderNode(node, form) {
        let name = ""
        let content = ""
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
                for (let kv in FuncType) {
                    if (form.funcType == FuncType[kv]) {
                        content = kv
                        break
                    }
                }
                break;
        }
        node.prop('data', form)
        node.attr("title/textWrap/text", name)
        node.attr("content/textWrap/text", content)
    }


    // 设置连接
    setTargetLink(source, id) {
        let type = source.attributes.mtype
        let target = this.findNode(id)
        this.setTargetID('create', type, source.attributes.data, id, target.attributes.data)
    }

    // 设置连接对象的id
    setTargetID(mode, type, source, id, target = null) {
        try {
            let removeArray = []
            switch (type) {
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

    // 删除节点
    removeNode(id) {
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
            let model = this.nodes[index]
            this.clearLineWithRemoveNode(id)
            model.remove()
            this.nodes.splice(index, 1)
            this.vue.currentForm = null
        }
    }

    // 当删除点之前 要清除和节点存在关联的targetid
    clearLineWithRemoveNode(id) {
        try {
            for (let i = 0; i < this.lines.length; i++) {
                let item = this.lines[i]
                let target = item.target.attributes
                let source = item.source.attributes
                if (target?.id == id) {
                    this.setTargetID('remove', source.mtype, source.data, id, null)
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

    //删除线
    removeLine(id) {
        for (let i = 0; i < this.lines.length; i++) {
            let item = this.lines[i]
            if (item.model.id == id) {
                try {
                    if (this.mustNode.includes(item.target.id) && this.mustNode.includes(item.source.id)) {
                        return Message.error("不能删除两个都是必要节点的连接")
                    }
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

    // 存储数据
    saveData() {
        let flowData = this.createExportData()
        var elementA = document.createElement("a");
        //文件的名称为时间戳加文件名后缀
        elementA.download = +new Date() + ".json";
        elementA.style.display = "none";
        //生成一个blob二进制数据，内容为json数据
        var blob = new Blob([JSON.stringify(flowData)])
        //生成一个指向blob的URL地址，并赋值给a标签的href属性
        elementA.href = URL.createObjectURL(blob);
        document.body.appendChild(elementA);
        elementA.click();
        document.body.removeChild(elementA);
    }

    // 创建导出的结构
    createExportData() {
        let { tabs, currentTab } = this.vue
        if (tabs[currentTab].data.length == 0) {
            tabs[currentTab].data = this.getSaveData()
        }
        let blockDatas = {
            head: tabs[0].data.cells[0].data,
            blocks: []
        }
        for (let i = 1; i < tabs.length; i++) {
            if (tabs[i].data?.cells[0]) {
                blockDatas.blocks.push(tabs[i].data.cells[0].data)
            }
        }
        return blockDatas
    }

    getSaveData() {
        return this.graph.toJSON()
    }

    // 读取数据 从文件读取
    async loadData() {
        let data = await new Promise((resolve, reject) => {
            let input = document.createElement('input');
            input.value = '选择文件';
            input.type = 'file';
            input.onchange = event => {
                let file = event.target.files[0];
                let file_reader = new FileReader();
                file_reader.onload = () => {
                    let fc = file_reader.result;
                    resolve(fc); // 返回文件文本内容到Promise

                };
                file_reader.readAsText(file, 'UTF-8');
            };
            input.click();
        });
        let flowData = JSON.parse(data)
        this.writeData(flowData)
    }

    // 写入数据
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


    clearTable() {
        this.nodes = []
        this.lines = []
        this.mustNode = []
        this.graph.clear();
    }

    // 获取结构
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


}


export default {
    JointClass,
}