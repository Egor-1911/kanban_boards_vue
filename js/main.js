let eventBus = new Vue()

Vue.component('task-card', {
    props: {
        task: { type: Object, required: true },
        columnId: { type: Number, required: true }
    },
    template: `
    <div class="task-card">
        <div v-if="!isEditing && !isReturning">
            <h3>{{ task.title }}</h3>
            <p>{{ task.description }}</p>
            <p v-if="task.returnReason" style="color: #d9534f;"><strong>Причина возврата:</strong> {{ task.returnReason }}</p>
            <p><strong>Дэдлайн:</strong> {{ task.deadline }}</p>
            
            <p v-if="columnId === 4">
                <strong>Статус:</strong> 
                <span :style="{ color: task.completedStatus === 'Просрочено' ? 'red' : 'green' }">
                    {{ task.completedStatus }}
                </span>
            </p>
            
            <small>Создано: {{ task.createdAt }}</small>
            <small v-if="task.lastEdit">Изменено: {{ task.lastEdit }}</small>
            
            <div class="card-actions">
                <button v-if="columnId !== 4" @click="isEditing = true">Редактировать</button>
                <button v-if="columnId < 4" @click="moveForward">Переместить</button>
                <button v-if="columnId === 3" @click="isReturning = true">← Назад</button>
                <button v-if="columnId === 1" @click="removeTask">Удалить</button>
            </div>
        </div>
        
        <!-- редактирование -->
        <div v-else-if="isEditing" class="edit-form">
            <input v-model="editTitle" class="task-input">
            <textarea v-model="editDescription" class="task-textarea"></textarea>
            <button @click="saveEdit" class="btn-add">Сохранить</button>
            <button @click="isEditing = false" class="btn-add" style="background:#ccc; margin-top:5px">Отмена</button>
        </div>

        <!-- возврат-->
        <div v-else-if="isReturning" class="edit-form">
            <textarea v-model="returnReason" placeholder="Укажите причину возврата" class="task-textarea"></textarea>
            <button @click="confirmReturn" class="btn-add">Подтвердить возврат</button>
            <button @click="isReturning = false" class="btn-add" style="background:#ccc; margin-top:5px">Отмена</button>
        </div>
    </div>
    `,
    data() {
        return {
            isEditing: false,
            isReturning: false,
            returnReason: '',
            editTitle: this.task.title,
            editDescription: this.task.description
        }
    },
    methods: {
        saveEdit() {
            const updatedTask = {
                ...this.task,
                title: this.editTitle,
                description: this.editDescription,
                lastEdit: new Date().toLocaleString()
            };
            eventBus.$emit('update-task', updatedTask);
            this.isEditing = false;
        },
        moveForward() {
            eventBus.$emit('move-task', this.task.id);
        },
        confirmReturn() {
            if (this.returnReason.trim()) {
                eventBus.$emit('move-task-back', { taskId: this.task.id, reason: this.returnReason });
                this.isReturning = false;
                this.returnReason = '';
            }
        },
        removeTask() {
            eventBus.$emit('remove-task', this.task.id);
        }
    }
})

Vue.component('task-form', {
    template: `
    <form class="task-form" @submit.prevent="onSubmit">
        <p v-if="errors.length"><b>Исправьте ошибки:</b></p>
        <ul><li v-for="error in errors">{{ error }}</li></ul>
        <input type="text" v-model="title" placeholder="Название" class="task-input">
        <textarea v-model="description" placeholder="Описание" class="task-textarea"></textarea>
        <input type="date" v-model="deadline" class="task-input">
        <button type="submit" class="btn-add">Добавить задачу</button>
    </form>
    `,
    data() { return { title: null, description: null, deadline: null, errors: [] } },
    methods: {
        onSubmit() {
            this.errors = [];
            if (this.title && this.description && this.deadline) {
                eventBus.$emit('task-added', {
                    id: Date.now(),
                    title: this.title,
                    description: this.description,
                    deadline: this.deadline,
                    createdAt: new Date().toLocaleString(),
                    lastEdit: new Date().toLocaleString()
                });
                this.title = this.description = this.deadline = null;
            } else {
                this.errors.push("Заполните все поля");
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
                <div class="tasks-container">
                    <task-card v-for="task in column.tasks" :key="task.id" :task="task" :column-id="column.id"></task-card>
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
        saveTasks() { localStorage.setItem('kanban-columns', JSON.stringify(this.columns)); }
    },
    mounted() {
        const savedData = localStorage.getItem('kanban-columns');
        if (savedData) this.columns = JSON.parse(savedData);

        eventBus.$on('task-added', task => {
            this.columns[0].tasks.push(task);
            this.saveTasks();
        });

        eventBus.$on('remove-task', id => {
            this.columns[0].tasks = this.columns[0].tasks.filter(t => t.id !== id);
            this.saveTasks();
        });

        eventBus.$on('update-task', updatedTask => {
            for (let i = 0; i < 3; i++) {
                const idx = this.columns[i].tasks.findIndex(t => t.id === updatedTask.id);
                if (idx !== -1) {
                    this.columns[i].tasks.splice(idx, 1, updatedTask);
                    break;
                }
            }
            this.saveTasks();
        });

        eventBus.$on('move-task', id => {
            for (let i = 0; i < 3; i++) {
                const idx = this.columns[i].tasks.findIndex(t => t.id === id);
                if (idx !== -1) {
                    const task = this.columns[i].tasks.splice(idx, 1)[0];

                    if (i === 2) {
                        const today = new Date().setHours(0, 0, 0, 0);
                        const deadline = new Date(task.deadline).setHours(0, 0, 0, 0);

                        if (today > deadline) {
                            task.completedStatus = 'Просрочено'
                        } else {
                            task.completedStatus = 'Выполнено в срок'
                        }

                    }

                    this.columns[i+1].tasks.push(task);
                    this.saveTasks();
                    break;
                }
            }
            this.saveTasks();
        });

        eventBus.$on('move-task-back', ({ taskId, reason }) => {
            const idx = this.columns[2].tasks.findIndex(t => t.id === taskId);
            if (idx !== -1) {
                const task = this.columns[2].tasks.splice(idx, 1)[0];
                task.returnReason = reason;
                this.columns[1].tasks.push(task);
                this.saveTasks();
            }
        });
    }
})

new Vue({ el: '#app' })
