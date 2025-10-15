import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "../supabase-client";
import { Session } from "@supabase/supabase-js";

interface Task {
  id: number;
  created_at: string;
  title: string;
  description: string;
  image_url: string;
}

function TaskManager({ session }: { session: Session }) {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [taskImage, setTaskImage] = useState<File | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    let imageUrl: string | null = null;

    if (taskImage) {
      imageUrl = await uploadImage(taskImage);
    }

    const { error } = await supabase
      .from("tasks")
      .insert({ ...newTask, email: session.user.email, image_url: imageUrl })
      .single();

    if (error) {
      console.error("Error Adding task: ", error.message);
      return;
    }

    setNewTask({ title: "", description: "" });
  };

  const fetchTasks = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error reading task: ", error.message);
      return;
    }

    setTasks(data);
  };

  const deleteTask = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task: ", error.message);
      return;
    }
  };

  const updateTask = async (id: number) => {
    const { error } = await supabase
      .from("tasks")
      .update({ description: newDescription })
      .eq("id", id);

    if (error) {
      console.error("Error updating task: ", error.message);
      return;
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0]);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const filePath = `${file.name}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("tasks-images")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading image:", error.message);
      return null;
    }

    const { data } = await supabase.storage
      .from("tasks-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("tasks-channel");
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => {
          const newTask = payload.new as Task;
          setTasks((prev) => [...prev, newTask]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "tasks" },
        async () => {
          await fetchTasks();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => {
          const changedTask = payload.new as Task;
          setTasks((prev) =>
            prev.map((currentTask) =>
              currentTask.id === changedTask.id ? changedTask : currentTask
            )
          );
        }
      );
    channel.subscribe((status, error) => {
      if (error) console.error("channel error:", error);
      console.log("Subscription status:", status);
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  //console.log("tasks =", tasks);

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
      <h2>Task Manager CRUD</h2>

      {/* Form to add a new task */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <textarea
          placeholder="Task Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />

        <input type="file" accept="images/*" onChange={handleFileChange} />
        <button
          type="submit"
          disabled={!newTask.title}
          style={{ padding: "0.5rem 1rem" }}
        >
          Add Task
        </button>
      </form>

      {/* List of Tasks */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((task, key) => (
          <li
            key={key}
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "1rem",
              marginBottom: "0.5ren",
            }}
          >
            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <img src={task.image_url} style={{ height: "70px" }} alt="" />
              <br />
              <textarea
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Updated description..."
              />
              <div>
                <button
                  style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
                  onClick={() => updateTask(task.id)}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    deleteTask(task.id);
                  }}
                  style={{ padding: "0.5rem 1rem" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TaskManager;
