let eventBus = new Vue()

Vue.component('task-form', {
    template: `
    <form class="task-form" @submit.prevent="onSubmit">
        <p v-if="errors.length">
            <b>Исправьте ошибки:</b>
            <ul>
                <li v-for="error in errors">{{ error }}</li>
            </ul>
        </p>
        
        <input type="text" v-model="title" placeholder="Название задачи" class="task-input">
        
        <textarea v-model="description" placeholder="Описание задачи" class="task-textarea"></textarea>
        
        <label for="deadline">Дэдлайн:</label>
        <input type="date" id="deadline" v-model="deadline" class="task-input">
        
        <button type="submit" class="btn-add">Добавить задачу</button>
    </form>
    `,
    data() {
        return {
            title: null,
            description: null,
            deadline: null,
            errors: []
        }
    },
    methods: {
        onSubmit() {
            this.errors = [];
            if (this.title && this.description && this.deadline) {
                let newTask = {
                    id: Date.now(),
                    title: this.title,
                    description: this.description,
                    deadline: this.deadline,
                    createdAt: new Date().toLocaleString(),
                    lastEdit: new Date().toLocaleString(),
                    status: 'planned'
                }
                eventBus.$emit('task-added', newTask)
                this.title = null
                this.description = null
                this.deadline = null
            } else {
                if (!this.title) this.errors.push("Укажите заголовок.")
                if (!this.description) this.errors.push("Добавьте описание.")
                if (!this.deadline) this.errors.push("Установите дэдлайн.")
            }
        }
    }
})

Vue.component('kanban-board', {
    template:`
        <div class="board">
            <div v-for="(column, columnIndex) in columns" :key="column.id" class="column">
                <h2 class="column-title">{{ column.title }}</h2>
                
                <task-form v-if="columnIndex === 0"></task-form>

<!--                <div class="tasks-container"></div>-->
                
                <div class="tasks-container">
                    <div v-for="task in column.tasks" :key="task.id" class="task-card">
                        <h3>{{ task.title  }}</h3>
                        <p>{{ task.description }}</p>
                        <p><strong>Дэдлайн:</strong> {{ task.deadline }}</p>
                        <small>Создано: {{ task.createdAt }}</small>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            columns: [
                { id: 1, title: 'Запланированные задачи', tasks: [] },
                { id: 2, title: 'Задачи в работе', tasks: [] },
                { id: 3, title: 'Тестирование', tasks: [] },
                { id: 4, title: 'Выполненные задачи', tasks: [] }
            ]
        }
    },
    methods: {
        saveTasks() {
            localStorage.setItem('kanban-columns', JSON.stringify(this.columns));
        },
        addTask(task) {
            this.columns[0].tasks.push(task);
            this.saveTasks();
        },
    },
    mounted() {
        const savedData = localStorage.getItem('kanban-columns');
        if (savedData) {
            this.columns = JSON.parse(savedData);
        }

        eventBus.$on('task-added', task => {
            this.addTask(task);
        })
    }
})

let app = new Vue({
    el: '#app'
})