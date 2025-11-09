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

  // ✅ FIX: Declare fetchTasks BEFORE useEffect so ESLint is happy
  async function fetchTasks() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error loading tasks");
      console.error(error);
    } else {
      setTasks(data as Task[]);
    }

    setLoading(false);
  }

  // ✅ Load tasks on mount
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

    // realtime
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

  // Add task
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

  // Toggle complete
  const toggleCompleted = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !current })
      .eq("id", id);

    if (error) alert(error.message);
    else fetchTasks();
  };

  // Delete task
  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchTasks();
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Your Tasks</h1>
        <button className="text-sm text-red-600" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <form onSubmit={onAddTask} className="flex gap-2">
          <input
            {...register("title")}
            required
            placeholder="New task..."
            className="flex-1 border rounded p-2"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Add
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-3 rounded shadow flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleCompleted(task.id, task.completed)}
                />
                <span
                  className={
                    task.completed ? "line-through text-gray-500" : "text-gray-800"
                  }
                >
                  {task.title}
                </span>
              </div>
              <button
                className="text-sm text-red-600"
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
