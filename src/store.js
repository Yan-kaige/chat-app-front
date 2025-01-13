import { createStore } from 'vuex';

const store = createStore({
    state: {
        currentUser: null, // 当前登录用户信息
    },
    mutations: {
        setCurrentUser(state, user) {
            state.currentUser = user;
        },
        clearCurrentUser(state) {
            state.currentUser = null;
        },
    },
    getters: {
        getCurrentUser: (state) => state.currentUser,
    },
});

export default store;
