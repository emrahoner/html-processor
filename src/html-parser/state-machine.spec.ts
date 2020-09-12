import StateMachine from "./state-machine"

describe('StateMachine', () => {
    let stateMachine: StateMachine<any>,
        paymentClickedAction: jest.Mock,
        enoughBalanceAction: jest.Mock,
        notEnoughBalanceAction: jest.Mock,
        finishToInitAction: jest.Mock,
        errorToInitAction: jest.Mock,
        contextDataSpy: jest.Mock,
        eventHandler: jest.Mock
    
    beforeEach(() => {
        contextDataSpy = jest.fn()
        paymentClickedAction = jest.fn((_, context) => { contextDataSpy(context.data()); context.data(data => ({ click: (data?.click ?? 0) + 1 })) })
        enoughBalanceAction = jest.fn((_, context) => { contextDataSpy(context.data()); context.data(data => ({ click: (data?.click ?? 0) + 1 })) })
        notEnoughBalanceAction = jest.fn((_, context) => { contextDataSpy(context.data()); context.data(data => ({ click: (data?.click ?? 0) + 1 })) })
        finishToInitAction = jest.fn((_, context) => { contextDataSpy(context.data()); context.data(data => ({ click: (data?.click ?? 0) + 1 })) })
        errorToInitAction = jest.fn((_, context) => { contextDataSpy(context.data()); context.data(data => ({ click: (data?.click ?? 0) + 1 })) })
        eventHandler = jest.fn()
        
        stateMachine = new StateMachine({
            initialState: 'init',
            initialContext: {},
            states: {
                'init': {
                    on: {
                        'payment-clicked': {
                            to: 'payment',
                            action: paymentClickedAction
                        },
                        'shopping-cart-clicked': {
                            to: 'shopping-cart'
                        },
                        'error': {
                            to: 'error',
                            action: (_, context) => { context.emit('errorOccured', 'fatal error') }
                        }
                    }
                },
                'payment': {
                    on: {
                        'enough-balance': {
                            to: 'finish',
                            action: enoughBalanceAction
                        },
                        'not-enough-balace': {
                            to: 'error',
                            action: notEnoughBalanceAction
                        },
                        'cancel': {
                            to: 'finish',
                            action: (_, context) => { context.to('init') }
                        }
                    }
                },
                'finish': {
                    otherwise: {
                        to: 'init',
                        action: finishToInitAction
                    }
                },
                'error': {
                    otherwise: {
                        to: 'init',
                        action: errorToInitAction
                    }
                }
            }
        })

        stateMachine.on('errorOccured', eventHandler)
    })

    it('is at initial state initially', () => {
        expect(stateMachine.current).toBe('init')
    })

    it('navigates to correct state after an action is dispatched', () => {
        stateMachine.dispatch('payment-clicked')
        expect(stateMachine.current).toBe('payment')
        stateMachine.dispatch('enough-balance')
        expect(stateMachine.current).toBe('finish')
    })

    it('calls transition action when an action is dispatched', () => {
        stateMachine.dispatch('payment-clicked')
        stateMachine.dispatch('enough-balance')

        expect(paymentClickedAction).toHaveBeenCalledTimes(1)
        expect(paymentClickedAction).toHaveBeenCalledWith('payment-clicked', expect.anything())
        expect(enoughBalanceAction).toHaveBeenCalledTimes(1)
        expect(enoughBalanceAction).toHaveBeenCalledWith('enough-balance', expect.anything())
    })

    it('calls otherwise action when an action is not in transitions array', () => {
        stateMachine.dispatch('payment-clicked')
        stateMachine.dispatch('enough-balance')
        stateMachine.dispatch('action-that-is-not-present')

        expect(finishToInitAction).toHaveBeenCalledWith('action-that-is-not-present', expect.anything())
    })

    it('navigates to state that is set by context.to', () => {
        stateMachine.dispatch('payment-clicked')
        stateMachine.dispatch('cancel')

        expect(stateMachine.current).toBe('init')
    })

    it('shares the context across state', () => {
        stateMachine.dispatch('payment-clicked')
        expect(contextDataSpy).toHaveBeenLastCalledWith({})
        stateMachine.dispatch('enough-balance')
        expect(contextDataSpy).toHaveBeenLastCalledWith({ click: 1 })
        stateMachine.dispatch('action-that-is-not-present')
        expect(contextDataSpy).toHaveBeenLastCalledWith({ click: 2 })
    })

    it('emits events triggered by the context', () => {
        stateMachine.dispatch('error')
        expect(eventHandler).toHaveBeenCalledTimes(1)
        expect(eventHandler).toHaveBeenCalledWith('fatal error')
    })

    it('throws error when state is not present', () => {
        expect(() => { stateMachine.dispatch('shopping-cart-clicked') }).toThrowError(/no state/)
    })

    it('throws error when action is not present', () => {
        expect(() => { stateMachine.dispatch('no-present-action') }).toThrowError(/no transition/)
    })
})