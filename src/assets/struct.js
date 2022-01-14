/*
 * @Author: 羊驼
 * @Date: 2022-01-10 18:08:39
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-14 15:15:40
 * @Description: file content
 */



export const FuncTriggerType = {
    触发调用: 0,
    直接调用: 1,
    强制直接调用: 2,
    强制触发调用: 3,
}

// export var FuncType = {
//     // 学习资源: 0,
//     // 对话: 1,

//     // 自动对话: 2,
//     // 做选择题: 3,
//     // 做物品准备: 4,
//     // 播放动画: 5,
//     // 体位调整: 6,
//     // 餐前准备: 7,
//     // 查看信息: 8,
//     // 提示弹窗: 9,
//     // 展示菜单: 10,
//     // 其他: 500
// }

export const BlockType = {
    普通节点: 0,
    流程节点: 1,
    触发器节点: 2,
}

export class Block {
    // 流程id
    id = ""
    // 流程名称
    blockName = "节点"
    // 命令列表
    process = []
    // 这个不用管 web上要分辨结构
    mtype = BlockType.普通节点
}


export class ProcessInfo {
    id = ""
    process = "新建流程"
    mtype = BlockType.流程节点
    triggersInfo = []
    processTip = ""
    fatherNode = ""
}


export class TriggerInfo {
    id = ""
    tag = ""
    userTip = ""
    triggerType = FuncTriggerType.直接调用
    mtype = BlockType.触发器节点
    funcType = ""
    funcArgs = []
    nextTrigger = null
    fatherNode = ""
}
