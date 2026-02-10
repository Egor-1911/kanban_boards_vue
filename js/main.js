let eventBus = new Vue()

Vue.component('task-card', {
    props: {
        task: {
            type: Object,
            required: true
        },
        columnId: {
            type: Number,
            required: true
        }
    },
    template: `
    <div class="task-card">
        <div v-if="!isEditing">
            <h3>{{ task.title  }}</h3>
            <p>{{ task.description }}</p>
            <p><strong>Дэдлайн:</strong> {{ task.deadline }}</p>
            <small>Создано: {{ task.createdAt }}</small>
            <small v-if="task.lastEdit">Изменено: {{ task.lastEdit }}</small>
            
            <div class="card-actions">
                <button v-if="columnId === 1" @click="startEdit">Редактировать</button>
                <button @click="removeTask" v-if="columnId === 1"> Удалить</button>
            </div>
        </div>
        
        <div v-else class="edit-form">
            <input v-model="editTitle" class="task-input">
            <textarea v-model="editDescription" class="task-textarea"></textarea>
            <button @click="saveEdit" class="btn-add">Сохранить</button>
            <button @click="isEditing = false" class="btn-add" style="background:#ccc; margin-top:5px">Отмена</button>
        </div>
    </div>
    `,

    data() {
        return {
            isEditing: false,
            editTitle: this.task.title,
            editDescription: this.task.description
        }
    },

    methods: {
        startEdit() {
            this.isEditing = true;
            this.editTitle = this.task.title;
            this.editDescription = this.task.description;
        },

        saveEdit() {
            const updatedTask = { // Добавь 'd' здесь
                ...this.task,
                title: this.editTitle,
                description: this.editDescription,
                lastEdit: new Date().toLocaleString(),
            };
            eventBus.$emit('update-task', updatedTask); // Теперь переменные совпадают
            this.isEditing = false;
        },

        removeTask() {
            eventBus.$emit('remove-task', this.task.id);
        }
    }
})

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
                    <task-card 
                        v-for="task in column.tasks" 
                        :key="task.id" 
                        :task="task" 
                        :column-id="column.id"
                    ></task-card>
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

        eventBus.$on('remove-task', taskId => {
            const column = this.columns.find(col => col.id === 1);
            column.tasks = column.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
        })

        eventBus.$on('update-task', updatedTask => {
            const column = this.columns.find(col => col.id === 1);
            const index = column.tasks.findIndex(t => t.id === updatedTask.id);
            if (index !== -1) {
                // Используем Vue.set или splice для сохранения реактивности
                column.tasks.splice(index, 1, updatedTask);
                this.saveTasks();
            }
        })

    }
})

let app = new Vue({
    el: '#app'
})