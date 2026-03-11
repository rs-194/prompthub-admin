import { createRouter, createWebHistory } from 'vue-router';
import Main from '@/views/Main.vue';
import About from '@/views/About.vue';
import House from '@/views/House.vue';

const routes = [
 { 
    path: '/', 
    name:'main',
    component: Main ,
    redirect:'/house',
    children:[
        {
            path: '/house',
            component: House
        }
    ]
},
 { path: '/about', component: About }
];
const router = createRouter({
 history: createWebHistory(),
 routes,
});

export default router;