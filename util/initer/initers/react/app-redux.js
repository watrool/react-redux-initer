require('babel-polyfill')
var pageParams = require('./lib/page-params.js')

var initer = {
    /**
     * @param
     *  opts.routes   路由信息
     *  opts.rootReducers
     *  opts.initialState
     */
    init (opts) {

        if (!this._store) this.configureStore(opts.rootReducers || {}, opts.initialState)

        opts = opts || {}

        var ReactDom = require('react-dom')
        var React = require('react')

        var {Provider} = require('react-redux')

        var {Router, hashHistory} = require('react-router')
        var {syncHistoryWithStore} = require('react-router-redux')

        const history = syncHistoryWithStore(hashHistory, this._store)

        ReactDom.render(
            <Provider store={this._store}>
                <Router history={history} routes={opts.routes}>
                </Router>
            </Provider>,
            document.getElementById('root')
        )
    },

    _store: null,

    configureStore (rootReducer = {}, initialState) {
        var thunk = require('redux-thunk').default
        var {createStore, compose, applyMiddleware, combineReducers} = require('redux')
        var {routerReducer, routerMiddleware} = require('react-router-redux')
        var {hashHistory} = require('react-router')

        const middleware = [
          thunk,
          routerMiddleware(hashHistory)
        ]

        const finalCreateStore = compose(
            applyMiddleware(...middleware)
        )(createStore)

        rootReducer.routing = routerReducer
        rootReducer.pageParams = pageParams.reducer

        const store = this._store = finalCreateStore(combineReducers({...rootReducer}), initialState)
        store.rootReducer = rootReducer
        store.asyncReducers = {}

        this.boots = require('./lib/boots')(store)

        return store
    },

    injectReducer (reducerName, reducer) {
        return this.boots.injectReducer(reducerName, reducer)
    },

    dummyRoutes(reducerName, reducer, Page) {
        const appRoutes = {
            path: '/',
            indexRoute: {onEnter: (nextState, replace) => replace('/test')},
            childRoutes: [
                {
                    path: 'test',
                    getComponent: (location, callback) => {
                        require.ensure([], () => {
                            initer.injectReducer(reducerName, reducer)
                            callback(null, Page)
                        })
                    }
                }
            ]
        }

        return appRoutes
    },

    setPageParams(props) {
        pageParams.triggers.setPageParam(this._store.dispatch, props)
    }


}


module.exports = initer;