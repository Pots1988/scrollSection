import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// import Projects from './components/Projects'
// import Project from './components/Project'
// import Signin from './components/Auth/Signin'
// import Signup from './components/Auth/Signup'
// import E404 from './components/E404'

export const router = new VueRouter({
  mode: 'history',
  routes: [
    // {
    //   path: '/projects',
    //   name: 'Projects',
    //   component: Projects
    // },
    // {
    //   path: '/signin',
    //   name: 'Signin',
    //   component: Signin
    // },
    // {
    //   path: '/signup',
    //   name: 'Signup',
    //   component: Signup
    // },
    // {
    //   path: '*',
    //   name: 'E404',
    //   component: E404
    // }
  ]
})
