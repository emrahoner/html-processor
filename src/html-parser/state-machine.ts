interface StateMachineTransition<TContextData> {
    to: string
    action?: (action: string, context: StateMachineContext<TContextData>) => void
}

interface StateMachineTransitions<TContextData> {
    [transition: string]: StateMachineTransition<TContextData>
}

interface StateMachineState<TContextData> {
    on?: StateMachineTransitions<TContextData>
    otherwise?: StateMachineTransition<TContextData>
}

interface StateMachineStates<TContextData> {
    [state: string]: StateMachineState<TContextData>
}

interface StateMachineEventHandlers<TContextData> {
    finished?: (context: StateMachineContext<TContextData>) => void
    [event: string]: (...args: any[]) => void
}

interface StateMachineOptions<TContextData> {
    initialState: string
    initialContext?: TContextData
    states: StateMachineStates<TContextData>
    handlers?: StateMachineEventHandlers<TContextData>
}

type DataFunction<T> = (data: T) => T

interface StateMachineContext<TContextData> {
    data(data?: TContextData | DataFunction<TContextData>): TContextData
    emit(event: string, ...params: any[])
    to(state: string)
}

class DefaultStateMachineContext<TContextData> implements StateMachineContext<TContextData> {
    private _onAllCallback: (event: string, ...args: any[]) => void
    private _data: TContextData
    private _to: string

    constructor(data: TContextData) {
        this._data = Object.assign({}, data)
    }

    onAll(callback: (event: string, ...args: any[]) => void) {
        this._onAllCallback = callback
    }

    emit(event: string, ...args: any[]) {
        this._onAllCallback && this._onAllCallback(event, ...args)
    }

    data(data?: TContextData & DataFunction<TContextData>): TContextData {
        if(typeof data === 'undefined') {
            return this._data
        }
        this._data = Object.assign({}, typeof data === 'function' ? data(this._data) : data)
    }

    to(state?: string): string {
        if(typeof state === 'undefined') {
            return this._to
        }
        this._to = state
    }
}

class StateMachine<TContextData> {
    private currentState: string
    private context: DefaultStateMachineContext<TContextData>
    private handlers: { [event: string]: ((...args: any[]) => void)[] }

    constructor(private options: StateMachineOptions<TContextData>) {
        this.handlers = {}
        this.reset()
    }

    get current(): string {
        return this.currentState
    }

    on(event: string, handler: (...args: any[]) => void) {
        if(!this.handlers[event]) {
            this.handlers[event] = []
        }
        this.handlers[event].push(handler)
    }

    dispatch(action: string) {
        const stateOptions = this.options.states[this.currentState]
        if(!stateOptions) throw new Error(`There is no state named '${this.currentState}' in the state machine`)
        const transition = (stateOptions.on && stateOptions.on[action]) ?? stateOptions.otherwise
        if(!transition) throw new Error(`There is no transition named '${action}' or else transition for the '${this.currentState}' action`)

        transition.action && transition.action(action, this.context)
        const contextTo = this.context.to() ?? transition.to
        if(!this.options.states[contextTo]) throw new Error(`There is no state named '${this.currentState}' in the state machine`)
        this.currentState = contextTo
        this.context.to(null)
    }

    finish() {
        this.options && this.options.handlers && this.options.handlers.finished && this.options.handlers.finished(this.context)
    }

    reset() {
        this.currentState = this.options.initialState
        this.context = new DefaultStateMachineContext<TContextData>(this.options.initialContext)
        this.context.onAll((event, args) => {
            if(this.handlers[event]) {
                this.handlers[event].forEach(handler => {
                    handler(args)
                })
            }
        })
    }
}

export default StateMachine
export {
    StateMachineOptions,
    StateMachineStates,
    StateMachineState,
    StateMachineTransitions,
    StateMachineTransition,
    StateMachineEventHandlers,
    StateMachineContext
}