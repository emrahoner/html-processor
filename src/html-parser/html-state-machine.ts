import StateMachine, { StateMachineTransition, StateMachineTransitions, StateMachineStates, StateMachineContext, StateMachineOptions } from './state-machine'

interface StateContext {
    tagName?: string
    attrName?: string
    attrValue?: string
    attrValueSpecialCharacter?: string
    attributes?: { name: string, value: string }[]
    endTagName?: string
    text?: string
    deferedText?: string
}

interface TextNode {
    text: string
}

interface ElementNodeAttribute {
    name: string
    value: string
}

interface ElementNode {
    tagName: string
    attributes: ElementNodeAttribute[]
}

const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const lowerCaseLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const upperCaseLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
const letters = [...lowerCaseLetters, ...upperCaseLetters]
const alphaNumberics = [...letters, ...numbers]
const whitespaces = [' ', '\n', '\r', '\t']

declare type HtmlStateMachineContext = StateMachineContext<StateContext>
declare type HtmlStateMachineStates = StateMachineStates<StateContext>

function createTransitions(transitionNames: string[], transition: StateMachineTransition<StateContext>) : StateMachineTransitions<StateContext> {
    const transitions = {}
    transitionNames.forEach(transitionName => {
        transitions[transitionName] = transition
    })
    return transitions
}

function tagEndWithInnerTextStates(tagName: string) : HtmlStateMachineStates {
    const states: HtmlStateMachineStates = {
        [tagName]: {
            on: {
                '<': {
                    to: `${tagName}End0`,
                    action: appendDeferedText
                }
            },
            otherwise: {
                to: tagName,
                action: appendText
            }
        },
        [`${tagName}End0`]: {
            on: {
                '/': {
                    to: `${tagName}End1`,
                    action: appendDeferedText
                }
            },
            otherwise: {
                to: tagName,
                action: (action, context) => {
                    context.data(data => {
                        data.text = (data.text ?? '') + (data.deferedText ?? '') + action
                        data.deferedText = ''
                        return data
                    })
                }
            }
        }
    }
    for(let i = 0; i < tagName.length; i++) {
        states[`${tagName}End${i+1}`] = {
            on: {
                [tagName[i]]: {
                    to: `${tagName}End${i+2}`,
                    action: appendDeferedText
                }
            },
            otherwise: {
                to: tagName,
                action: (action, context) => {
                    context.data(data => {
                        data.text = (data.text ?? '') + (data.deferedText ?? '') + action
                        data.deferedText = ''
                        return data
                    })
                }
            }
        }
    }
    states[`${tagName}End${tagName.length + 1}`] = {
        on: {
            '>': {
                to: States.text,
                action: (_, context) => {
                    context.data(data => {
                        context.emit(Events.textCreated, { text: data.text })
                        context.emit(Events.elementEnded, { tagName: tagName.toUpperCase() })
                        return {}
                    })
                }
            }
        },
        otherwise: {
            to: tagName,
            action: (action, context) => {
                context.data(data => {
                    data.text = (data.text ?? '') + (data.deferedText ?? '') + action
                    data.deferedText = ''
                    return data
                })
            }
        }
    }
    return states
}

enum States {
    text = 'text',
    tagStartOrEnd = 'tagStartOrEnd',
    tagEnd = 'tagEnd',
    tagStart = 'tagStart',
    attrIdle = 'attrIdle',
    attrIdleOrName = 'attrIdleOrName',
    attrName = 'attrName',
    attrValue = 'attrValue',
    attrEqual = 'attrEqual',
}

enum Events {
    textCreated = 'textCreated',
    elementStarted = 'elementStarted',
    elementEnded = 'elementEnded'
}

const appendText = (action: string, context: HtmlStateMachineContext) => {
    context.data(data => {
        data.text = (data.text ?? '') + action
        return data
    })
}

const appendDeferedText = (action: string, context: HtmlStateMachineContext) => {
    context.data(data => {
        data.deferedText = (data.deferedText ?? '') + action
        return data
    })
}

const appendDeferedToText = (action: string, context: HtmlStateMachineContext) => {
    context.data((data) => {
        data.text = (data.text ?? '') + data.deferedText + action
        data.deferedText = ''
        return data
    })
}

const appendTagName = (action: string, context: HtmlStateMachineContext) => {
    context.data((data) => {
        data.tagName = (data.tagName ?? '') + action
        return data
    })
}

const appendAttrName = (action: string, context: HtmlStateMachineContext) => {
    context.data((data) => {
        data.attrName = (data.attrName ?? '') + action
        return data
    })
}

const appendAttrValue = (action: string, context: HtmlStateMachineContext) => {
    context.data((data) => {
        data.attrValue = (data.attrValue ?? '') + action
        return data
    })
}

const pushAttr = (action: string, context: HtmlStateMachineContext) => {
    context.data(data => {
        if(data.attrName) {
            data.attributes.push({ name: data.attrName, value: data.attrValue ?? '' })
        }
        data.attrName = data.attrValue = data.attrValueSpecialCharacter = ''
        return data
    })
}

const appendEndTagNameAndDeferedText = (action: string, context: HtmlStateMachineContext) => {
    context.data((data) => {
        data.deferedText = (data.deferedText ?? '') + action
        data.endTagName = (data.endTagName ?? '') + action
        return data
    })
}

const elementStarted = (action: string, context: HtmlStateMachineContext) => {
    context.data((data) => {
        if(data.tagName === 'script' || data.tagName === 'style') {
            context.to(data.tagName)
        }
        context.emit(Events.elementStarted, { tagName: data.tagName.toUpperCase(), attributes: data.attributes ?? [] })
        return {}
    })
}

const elementEnded = (action: string, context: HtmlStateMachineContext) => {
    context.data((data) => {
        if(data.endTagName) {
            context.emit(Events.elementEnded, { tagName: data.endTagName.toUpperCase() })
        }
        return {}
    })
}

const textCreated = (action: string, context: HtmlStateMachineContext) => {
    context.data((data) => {
        if(data.text) {
            context.emit(Events.textCreated, { text: data.text })
        }
        data.text = data.deferedText = ''
        return data
    })
}

const options: StateMachineOptions<StateContext> = {
    initialState: States.text,
    initialContext: {},
    states: {
        [States.text] : {
            on: {
                '<': {
                    to: States.tagStartOrEnd,
                    action: appendDeferedText
                }
            },
            otherwise: {
                to: States.text,
                action: appendText
            }
        },
        [States.tagStartOrEnd]: {
            on: {
                '/': {
                    to: States.tagEnd,
                    action: appendDeferedText
                },
                ...createTransitions(alphaNumberics, {
                    to: States.tagStart,
                    action: (action, context) => {
                        textCreated(action, context)
                        appendTagName(action, context)
                    }
                })
            },
            otherwise: {
                to: States.text,
                action: appendDeferedToText
            }
        },
        [States.tagStart]: {
            on: {
                ...createTransitions(alphaNumberics, {
                    to: States.tagStart,
                    action: appendTagName
                }),
                ...createTransitions(whitespaces, {
                    to: States.attrIdle,
                    action: (_, context) => {
                        context.data(data => {
                            data.attributes = []
                            return data
                        })
                    }
                }),
                '>': {
                    to: States.text,
                    action: elementStarted
                }
            }
        },
        [States.tagEnd]: {
            on: {
                ...createTransitions(alphaNumberics, {
                    to: States.tagEnd,
                    action: appendEndTagNameAndDeferedText
                }),
                '>': {
                    to: States.text,
                    action: (action, context) => {
                        textCreated(action, context)
                        elementEnded(action, context)
                    }
                }
            },
            otherwise: {
                to: States.text,
                action: appendDeferedToText
            }
        },
        [States.attrIdle]: {
            on: {
                ...createTransitions(alphaNumberics, {
                    to: States.attrName,
                    action: appendAttrName
                }),
                ...createTransitions([...whitespaces, '/'], {
                    to: States.attrIdle
                }),
                '>': {
                    to: States.text,
                    action: elementStarted
                }
            }
        },
        [States.attrName]: {
            on: {
                ...createTransitions([...alphaNumberics, '-', '_'], {
                    to: States.attrName,
                    action: appendAttrName
                }),
                ...createTransitions(whitespaces, {
                    to: States.attrIdleOrName
                }),
                '=': {
                    to: States.attrEqual
                },
                '/': {
                    to: States.attrIdle
                },
                '>': {
                    to: States.text,
                    action: (action, context) => {
                        pushAttr(action, context)
                        elementStarted(action, context)
                    }
                }
            }
        },
        [States.attrIdleOrName]: {
            on: {
                ...createTransitions(alphaNumberics, {
                    to: States.attrName,
                    action: (action, context) => {
                        pushAttr(action, context)
                        appendAttrName(action, context)
                    }
                }),
                ...createTransitions(whitespaces, {
                    to: States.attrIdleOrName
                }),
                '=': {
                    to: States.attrEqual
                },
                '>': {
                    to: States.text,
                    action: (action, context) => {
                        pushAttr(action, context)
                        elementStarted(action, context)
                    }
                }
            }
        },
        [States.attrEqual]: {
            on: {
                ...createTransitions(whitespaces, {
                    to: States.attrEqual
                }),
                ...createTransitions(['"', '\''], {
                    to: States.attrValue,
                    action: (action, context) => {
                        context.data((data) => {
                            data.attrValueSpecialCharacter = action
                            data.attrValue = ''
                            return data
                        })
                    }
                }),
                ...createTransitions(alphaNumberics, {
                    to: States.attrValue,
                    action: (action, context) => {
                        context.data(data => {
                            data.attrValueSpecialCharacter = ''
                            data.attrValue = action
                            return data
                        })
                    }
                }),
                '>': {
                    to: States.text,
                    action: (action, context) => {
                        pushAttr(action, context)
                        elementStarted(action, context)
                    }
                }
            }
        },
        [States.attrValue]: {
            on: {
                ...createTransitions(whitespaces, {
                    to: States.attrValue,
                    action: (action, context) => {
                        context.data(data => {
                            if(data.attrValueSpecialCharacter === '') {
                                data.attributes.push({ name: data.attrName, value: data.attrValue })
                                data.attrName = data.attrValue = data.attrValueSpecialCharacter = ''
                                context.to(States.attrIdle)
                            } else {
                                data.attrValue += action
                            }
                            return data
                        })
                    }
                })
            },
            otherwise: {
                to: States.attrValue,
                action: (action, context) => {
                    context.data(data => {
                        if(action === data.attrValueSpecialCharacter) {
                            data.attributes.push({ name: data.attrName, value: data.attrValue })
                            data.attrName = data.attrValue = data.attrValueSpecialCharacter = ''
                            context.to(States.attrIdle)
                        } else {
                            data.attrValue += action
                        }
                        return data
                    })
                }
            }
        },
        ...tagEndWithInnerTextStates('script'),
        ...tagEndWithInnerTextStates('style')
    },
    handlers: {
        finished: (context) => {
            const data = context.data()
            const text = (data.text ?? '') + (data.deferedText ?? '')
            if(text) {
                context.emit('textCreated', { text })
            }
        }
    }
}

class HtmlStateMachine extends StateMachine<StateContext> {
    constructor() {
        super(options)
    }
}

export default HtmlStateMachine
export {
    TextNode,
    ElementNode,
    ElementNodeAttribute
}