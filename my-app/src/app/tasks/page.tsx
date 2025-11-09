"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

type FormData = { title: string };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<FormData>();

  // Fetch tasks
  async function fetchTasks() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (error) alert(error.message);
    else setTasks(data as Task[]);
    setLoading(false);
  }

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        router.push("/login");
        return;
      }
      fetchTasks();
    };
    init();

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        fetchTasks
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const onAddTask = handleSubmit(async (data) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return router.push("/login");
    const { error } = await supabase.from("tasks").insert({
      user_id: auth.user.id,
      title: data.title,
    });
    if (error) alert(error.message);
    else {
      reset();
      fetchTasks();
    }
  });

  const toggleCompleted = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !current })
      .eq("id", id);
    if (error) alert(error.message);
    else fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchTasks();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Your Tasks
          </h1>
          <button
            onClick={signOut}
            className="text-sm text-red-600 hover:text-red-500 transition"
          >
            Sign Out
          </button>
        </div>

        {/* Add Task */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg mb-6">
          <form onSubmit={onAddTask} className="flex gap-3">
            <input
              {...register("title")}
              required
              placeholder="Add a new task..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </form>
        </div>

        {/* Task List */}
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No tasks yet.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow flex justify-between items-center transition hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleCompleted(task.id, task.completed)}
                    className="w-5 h-5 accent-blue-600"
                  />
                  <span
                    className={`text-gray-900 dark:text-gray-100 text-lg transition ${
                      task.completed ? "line-through text-gray-400 dark:text-gray-500" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-600 hover:text-red-500 transition font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
