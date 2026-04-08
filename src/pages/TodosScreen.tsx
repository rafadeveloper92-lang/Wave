import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

interface Todo {
  id: number;
  name: string;
  is_completed: boolean;
}

export default function TodosScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching todos:', error);
      alert('Erro ao buscar dados: ' + error.message);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const { data, error } = await supabase
      .from('todos')
      .insert([{ name: newTodo, is_completed: false }])
      .select();

    if (error) {
      console.error('Error adding todo:', error);
      alert('Erro ao adicionar: ' + error.message);
    } else if (data) {
      setTodos([...todos, data[0]]);
      setNewTodo('');
    }
  }

  async function toggleTodo(id: number, is_completed: boolean) {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !is_completed })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
    } else {
      setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !is_completed } : t));
    }
  }

  async function deleteTodo(id: number) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
    } else {
      setTodos(todos.filter(t => t.id !== id));
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 pb-24 max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white tracking-tighter">Supabase Todos</h2>
        <div className="px-2 py-0.5 bg-brand/10 text-brand text-[8px] font-black uppercase tracking-widest rounded-full border border-brand/20">
          Live Sync
        </div>
      </div>

      <form onSubmit={addTodo} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="O que precisa ser feito?"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand/50 transition-colors"
        />
        <button 
          type="submit"
          className="bg-brand text-black p-3 rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-[32px] border border-dashed border-white/10">
              <p className="text-gray-500 font-medium">Nenhuma tarefa encontrada no Supabase.</p>
            </div>
          ) : (
            todos.map((todo) => (
              <motion.div 
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-[16px] group hover:bg-white/[0.07] transition-all"
              >
                <button 
                  onClick={() => toggleTodo(todo.id, todo.is_completed)}
                  className={todo.is_completed ? "text-brand" : "text-gray-500"}
                >
                  {todo.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <span className={`flex-1 font-medium text-base ${todo.is_completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {todo.name}
                </span>
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
