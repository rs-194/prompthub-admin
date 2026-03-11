
import { ref } from "vue";
export const Child = ref([
  {
    path: '/setting',
    label: '父级3',
    name:'setting',
    icon:'setting',
  },
  {
    path: '/user',
    label: '父级4',
    name:'user',
    icon:'Avatar',
  },
  {
    path: '/',
    label: '首页',
    name: 'home',
    icon:'House',
    children: [
      {
        path: '/home/child1',
        label: '关于',
        icon:'',
      },
      {
        path: '/home/child2',
        label: '子级1-2',
        icon:''
      }
    ]
  },
  {
    path: '/main',
    label: '父级2',
    icon:'setting',
    children: [
      {
        path: '/child2-1',
        label: '子级2-1',
        icon:''
      },
      {
        path: '/child2-2',
        label: '子级2-2',
        icon:'',
      }
    ]
  },

])