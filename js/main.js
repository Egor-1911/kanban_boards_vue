let app = new Vue({
    el: '#app',
    data: {
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
    }

})