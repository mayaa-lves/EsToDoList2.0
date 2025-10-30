// Variáveis de Estado Global
        let tasks = [];
        let currentPriority = 4; // Prioridade padrão (P4)
        let currentFilter = {
            status: 'all', // 'all', 'active', 'completed'
            priority: 'all', // 'all', '1', '2', '3', '4'
            date: '' // 'YYYY-MM-DD'
        };
        
        // --- FUNÇÕES AUXILIARES DE PERSISTÊNCIA (localStorage) ---
        function loadTasks() {
            const storedTasks = localStorage.getItem('tasks');
            // Inicializa com uma tarefa de exemplo se for a primeira vez
            if (!storedTasks) {
                tasks = [{
                    id: '1',
                    title: 'Exemplo: Limpar Casa',
                    description: 'Passar vassoura e aspirador na sala.',
                    completed: false,
                    dueDate: '',
                    priority: 4, 
                    reminder: false,
                    createdAt: Date.now()
                },
                {
                    id: '2',
                    title: 'Comprar mantimentos',
                    description: 'Pão, leite e ovos.',
                    completed: true,
                    dueDate: '',
                    priority: 2, 
                    reminder: false,
                    createdAt: Date.now() - 1000000
                }];
                saveTasks();
            } else {
                tasks = JSON.parse(storedTasks);
            }
        }

        function saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        // --- FUNÇÕES DE LAYOUT ---

        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        }
        
        function toggleFilterMenu(shouldToggle = true) {
            const dropdown = document.getElementById('filter-dropdown');
            if (shouldToggle) {
                dropdown.classList.toggle('active');
            } else {
                // Força o fechamento se shouldToggle for false
                dropdown.classList.remove('active');
            }
        }

        // --- FUNÇÕES DE RENDERIZAÇÃO E UTILITÁRIOS ---

        // Função para formatar a data de YYYY-MM-DD para DD/MM
        function formatDate(dateString) {
            if (!dateString) return '';
            // Adiciona 'T00:00:00' para evitar problemas de fuso horário na conversão
            const date = new Date(dateString + 'T00:00:00'); 
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            
            // Compara apenas a data (dia, mês, ano)
            const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

            if (isSameDay(date, today)) {
                return 'Hoje';
            } else if (isSameDay(date, tomorrow)) {
                return 'Amanhã';
            } else {
                return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(date);
            }
        }

        // Função para criar o ícone SVG (apenas para referência, usando SVG inline abaixo)
        function createIcon(path, className = 'w-5 h-5') {
            return `
                <svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${path}" />
                </svg>
            `;
        }

        function renderTaskList() {
            const taskList = document.getElementById('task-list');
            taskList.innerHTML = '';
            
            // 1. Aplica Filtragem
            const filteredTasks = tasks.filter(task => {
                const searchInput = document.getElementById('search-input').value.toLowerCase();
                
                // 1.1 Filtro de Pesquisa (Texto)
                const matchesSearch = task.title.toLowerCase().includes(searchInput) || 
                                      (task.description && task.description.toLowerCase().includes(searchInput));

                // 1.2 Filtro de Status
                const matchesStatus = currentFilter.status === 'all' || 
                                      (currentFilter.status === 'completed' && task.completed) ||
                                      (currentFilter.status === 'active' && !task.completed);
                
                // 1.3 Filtro de Prioridade
                const matchesPriority = currentFilter.priority === 'all' || 
                                        task.priority.toString() === currentFilter.priority;
                
                // 1.4 Filtro de Data
                const matchesDate = !currentFilter.date || task.dueDate === currentFilter.date;
                
                return matchesSearch && matchesStatus && matchesPriority && matchesDate;
            });
            
            // 2. Aplica Ordenação
            const sortedTasks = [...filteredTasks].sort((a, b) => {
                // Tarefas incompletas vêm antes das concluídas
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                // Ordena por prioridade (P1 > P4) se estiverem no mesmo status
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                // Por fim, mais recentes primeiro
                return b.createdAt - a.createdAt; 
            });


            if (sortedTasks.length === 0) {
                 taskList.innerHTML = `
                    <div class="text-center p-6 text-gray-500 dark:text-gray-400 main-container rounded-xl">
                        Nenhuma tarefa corresponde aos filtros atuais.
                    </div>
                `;
                return;
            }

            // 3. Renderiza a Lista
            sortedTasks.forEach(task => {
                const isEditing = task.id === document.getElementById('edit-task-id').value;
                const dateDisplay = task.dueDate ? `
                    <div class="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>${formatDate(task.dueDate)}</span>
                    </div>
                ` : '';
                
                // Monta o HTML do item da tarefa
                const taskElement = document.createElement('div');
                taskElement.id = `task-${task.id}`;
                taskElement.className = `task-item flex items-start p-4 main-container rounded-xl border-l-4 border-p${task.priority} transition-all duration-300 ${isEditing ? 'editing-mode' : ''} hover:shadow-lg ${task.completed ? 'opacity-70 dark:opacity-50' : ''}`;
                
                taskElement.innerHTML = `
                    <!-- Checkbox de Status -->
                    <input 
                        type="checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onclick="toggleComplete('${task.id}')"
                        class="form-checkbox h-6 w-6 text-green-600 rounded-md cursor-pointer mt-0.5 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 border-2 border-gray-400 checked:border-green-600"
                    />
                    
                    <div class="ml-4 flex-1 min-w-0">
                        <!-- TÍTULO -->
                        <div class="flex items-center space-x-2">
                            <span class="text-lg font-bold ${task.completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'} break-words">
                                ${task.title}
                            </span>
                        </div>
                        
                        <!-- DESCRIÇÃO -->
                        <p class="text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'} break-words mt-0.5">
                            ${task.description || 'Sem descrição.'}
                        </p>
                        
                        <!-- INFO (Data e Prioridade) -->
                        <div class="flex items-center space-x-3 mt-1 text-xs">
                            ${dateDisplay}
                        </div>
                    </div>

                    <!-- BOTÕES DE AÇÃO -->
                    <div class="flex space-x-1 ml-4 self-center">
                        <span class="p-1 rounded-full text-p-red" title="Prioridade P${task.priority}"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 priority-${task.priority}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>
                        <button onclick="editTask('${task.id}')" class="text-blue-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/40 transition" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onclick="deleteTask('${task.id}')" class="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/40 transition" title="Excluir">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                `;
                taskList.appendChild(taskElement);
            });
        }
        
        // --- FUNÇÕES DE EVENTOS (CRUD) ---

        function getFormData() {
            // Verifica se a descrição é 'Descrição (opcional)' do placeholder e a limpa se for o caso
            const descriptionInput = document.getElementById('task-description');
            const description = descriptionInput.value.trim();
            
            return {
                title: document.getElementById('task-title').value.trim(),
                description: description,
                dueDate: document.getElementById('task-due-date').value,
                priority: currentPriority,
                // A função de lembrete está apenas visual, mantida false para simplicidade
                reminder: document.getElementById('task-reminder-btn').classList.contains('bg-yellow-100'),
            };
        }

        function clearForm() {
            document.getElementById('task-form-container').classList.remove('editing-mode');
            document.getElementById('task-form').reset();
            document.getElementById('edit-task-id').value = '';
            document.getElementById('form-title').textContent = 'O que você precisa fazer?';
            document.getElementById('submit-btn').textContent = 'Adicionar Tarefa';
            document.getElementById('submit-btn').classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            document.getElementById('submit-btn').classList.add('bg-red-500', 'hover:bg-red-600');
            
            // Reseta Prioridade para 4
            setCurrentPriority(4);
            
            // Reseta Lembrete
            const reminderBtn = document.getElementById('task-reminder-btn');
            reminderBtn.classList.remove('text-yellow-600', 'bg-yellow-100', 'dark:bg-yellow-900/40');
            reminderBtn.classList.add('text-gray-600', 'dark:text-gray-300', 'bg-gray-50', 'dark:bg-gray-700');
        }
        
        function handleFormSubmit(event) {
            event.preventDefault();
            
            const formData = getFormData();
            const taskId = document.getElementById('edit-task-id').value;
            
            if (taskId) {
                // Modo Edição
                saveTask(taskId, formData);
            } else {
                // Modo Criação
                addTask(formData);
            }
        }

        function addTask(data) {
            const newTask = {
                id: Date.now().toString(), // ID simples baseado no tempo
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                priority: data.priority,
                reminder: data.reminder,
                completed: false,
                createdAt: Date.now()
            };
            tasks.unshift(newTask); // Adiciona no início da lista
            saveTasks();
            clearForm();
            renderTaskList();
        }

        function editTask(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            // 1. Preencher Formulário
            document.getElementById('edit-task-id').value = id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-due-date').value = task.dueDate || '';
            
            // 2. Definir Prioridade
            setCurrentPriority(task.priority);

            // 3. Definir Lembrete (usando as cores do rascunho: amarelo)
            const reminderBtn = document.getElementById('task-reminder-btn');
            const isReminderActive = task.reminder;

            reminderBtn.classList.toggle('text-yellow-600', isReminderActive);
            reminderBtn.classList.toggle('bg-yellow-100', isReminderActive);
            reminderBtn.classList.toggle('dark:bg-yellow-900/40', isReminderActive);
            
            reminderBtn.classList.toggle('text-gray-600', !isReminderActive);
            reminderBtn.classList.toggle('dark:text-gray-300', !isReminderActive);
            reminderBtn.classList.toggle('bg-gray-50', !isReminderActive);
            reminderBtn.classList.toggle('dark:bg-gray-700', !isReminderActive);


            // 4. Mudar UI do Formulário
            document.getElementById('form-title').textContent = 'Editar Tarefa';
            document.getElementById('submit-btn').textContent = 'Salvar Alterações';
            document.getElementById('submit-btn').classList.remove('bg-red-500', 'hover:bg-red-600');
            document.getElementById('submit-btn').classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            document.getElementById('task-form-container').classList.add('editing-mode');
            
            // 5. Scroll para o topo para edição
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Fecha a sidebar se estiver aberta no mobile
            if (document.getElementById('sidebar').classList.contains('open')) {
                toggleSidebar();
            }
        }

        function saveTask(id, data) {
            const index = tasks.findIndex(t => t.id === id);
            if (index === -1) return;

            tasks[index] = {
                ...tasks[index],
                ...data
            };
            
            saveTasks();
            clearForm();
            renderTaskList();
        }

        function toggleComplete(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveTasks();
                renderTaskList();
            }
        }

        function deleteTask(id) {
            // Implementação de exclusão direta sem modal de confirmação (conforme restrição)
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTaskList();
            
            // Se estivermos editando, limpa o formulário
            if (document.getElementById('edit-task-id').value === id) {
                clearForm();
            }
        }
        
        // --- FUNÇÕES DE PRIORIDADE E LEMBRETE ---
        
        function setCurrentPriority(priority) {
            currentPriority = parseInt(priority);
            const buttons = document.querySelectorAll('#priority-selector .priority-btn');
            buttons.forEach(btn => {
                const p = parseInt(btn.dataset.priority);
                
                // Limpa todos os estilos de destaque
                btn.classList.remove('text-p-red', 'text-p-amber', 'text-p-blue', 'text-p-gray', 'bg-indigo-500/20');
                btn.classList.add('text-gray-400'); // Cor padrão para ícones
                
                if (p === currentPriority) {
                    btn.classList.add('bg-indigo-500/20');
                    if (p === 1) btn.classList.add('text-p-red');
                    else if (p === 2) btn.classList.add('text-p-amber');
                    else if (p === 3) btn.classList.add('text-p-blue');
                    else if (p === 4) btn.classList.add('text-p-gray');
                    btn.classList.remove('text-gray-400');
                }
            });
        }
        
        // --- FUNÇÕES DE FILTRO ---

        function filterTasks() {
            // Coleta a data do input
            currentFilter.date = document.getElementById('filter-date-input').value;
            renderTaskList();
        }

        function setFilter(type, value, button) {
            // Se o botão não for passado (chamada pelo sidebar), encontre o botão ativo para status/prioridade 'all'
            if (!button) {
                if (type === 'status') {
                    button = document.querySelector(`.filter-btn[data-filter-type="${type}"][data-filter-value="${value}"]`);
                } else if (type === 'priority') {
                    button = document.querySelector(`.filter-btn[data-filter-type="${type}"][data-filter-value="all"]`);
                    if(value === 'completed') {
                       // Quando clica em 'Concluídos' no sidebar, o filtro de prioridade continua 'all'
                       currentFilter['priority'] = 'all';
                       // Não precisamos atualizar o visual do botão de prioridade 'all' se não for ele que foi clicado.
                    }
                }
            }
            
            // 1. Atualiza o filtro atual
            currentFilter[type] = value;

            // 2. Remove a classe ativa de todos os botões do mesmo tipo
            document.querySelectorAll(`.filter-btn[data-filter-type="${type}"]`).forEach(btn => {
                btn.classList.remove('filter-active-all', 'bg-indigo-600', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-gray-500');
                btn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
            });

            // 3. Adiciona a classe ativa ao botão clicado
            if (button) {
                button.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
                
                if (type === 'status') {
                    // Status usam a cor principal (indigo)
                    button.classList.add('filter-active-all'); 
                } else if (type === 'priority') {
                    // Prioridades usam suas próprias cores no modo ativo
                    if (value === 'all') button.classList.add('filter-active-all');
                    else if (value === '1') button.classList.add('bg-red-500', 'text-white');
                    else if (value === '2') button.classList.add('bg-yellow-500', 'text-white');
                    else if (value === '3') button.classList.add('bg-blue-500', 'text-white');
                    else if (value === '4') button.classList.add('bg-p-gray', 'text-white');
                }
            }
            
            filterTasks(); // Re-renderiza a lista
        }

        // --- INICIALIZAÇÃO DA APLICAÇÃO ---
        document.addEventListener('DOMContentLoaded', () => {
            loadTasks();
            
            // Inicializa a prioridade padrão do formulário
            setCurrentPriority(4); 

            // Event Listeners para o formulário
            document.getElementById('task-form').addEventListener('submit', handleFormSubmit);
            document.getElementById('cancel-btn').addEventListener('click', clearForm);
            
            // Event Listener para o seletor de Prioridade do FORMULÁRIO
            document.getElementById('priority-selector').addEventListener('click', (e) => {
                const btn = e.target.closest('.priority-btn');
                if (btn) {
                    setCurrentPriority(btn.dataset.priority);
                }
            });
            
            // Event Listener para o botão de Lembrete
            document.getElementById('task-reminder-btn').addEventListener('click', (e) => {
                const btn = e.target.closest('#task-reminder-btn');
                if (btn) {
                    const isActive = btn.classList.toggle('bg-yellow-100');
                    btn.classList.toggle('dark:bg-yellow-900/40', isActive);
                    btn.classList.toggle('text-yellow-600', isActive);
                    
                    btn.classList.toggle('bg-gray-50', !isActive);
                    btn.classList.toggle('dark:bg-gray-700', !isActive);
                    btn.classList.toggle('text-gray-600', !isActive);
                    btn.classList.toggle('dark:text-gray-300', !isActive);
                }
            });
            
            // Event Listeners para os botões de Filtro
            document.querySelectorAll('.filter-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const type = this.dataset.filterType;
                    const value = this.dataset.filterValue;
                    setFilter(type, value, this);
                    toggleFilterMenu(false); // Fecha o dropdown após a seleção, se estiver aberto
                });
            });

            // Inicializa os filtros visuais
            const defaultStatusBtn = document.querySelector('.filter-btn[data-filter-type="status"][data-filter-value="all"]');
            if(defaultStatusBtn) setFilter('status', 'all', defaultStatusBtn);
            
            const defaultPriorityBtn = document.querySelector('.filter-btn[data-filter-type="priority"][data-filter-value="all"]');
            if(defaultPriorityBtn) setFilter('priority', 'all', defaultPriorityBtn);

            // Renderiza a lista inicial
            renderTaskList();
        });
