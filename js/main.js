let app = new Vue({
    el: '#app',
    data: {
        newTask: {
            title: '',
            description: '',
            deadline: ''
        },
        columns: [
            {
                id: 1,
                title: 'Запланированные задачи',
                tasks: []
            },
            {
                id: 2,
                title: 'Задачи в работе',
                tasks: []
            },
            {
                id: 3,
                title: 'Тестирование',
                tasks: []
            },
            {
                id: 4,
                title: 'Выполненные задачи',
                tasks: []
            },
        ]
    },
    methods: {
        addTask() {
            if (this.newTask.title.trim()) {
                const task = {
                    id: Date.now(),
                    title: this.newTask.title,
                    description: this.newTask.description,
                    createdAt: new Date().toISOString(),
                    deadline: this.newTask.deadline,
                    updatedAt: new Date().toISOString()
                };

                this.columns[0].tasks.push(task);

                this.newTask = {
                    title: '',
                    description: '',
                    deadline: ''
                };
            }
        }
    }

})