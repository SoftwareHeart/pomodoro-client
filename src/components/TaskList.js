import React from 'react';

function TaskList({ tasks, onSelectTask, onDeleteTask, activeTaskId }) {
    return (
        <div className="task-list">
            <h2>Görevler</h2>
            {tasks.length === 0 ? (
                <p>Henüz görev eklenmemiş.</p>
            ) : (
                <ul>
                    {tasks.map(task => (
                        <li
                            key={task.id}
                            className={task.id === activeTaskId ? 'active' : ''}
                            onClick={() => onSelectTask(task.id)}
                        >
                            <div className="task-info">
                                <span className="task-name">{task.taskName}</span>
                                <span className="task-duration">{task.duration} dk</span>
                                {task.isCompleted && <span className="completed-badge">Tamamlandı</span>}
                            </div>
                            <button
                                className="delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTask(task.id);
                                }}
                            >
                                Sil
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default TaskList;