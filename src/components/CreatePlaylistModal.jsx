"use client";

import { useState } from "react";
import { X } from "lucide-react";

const CreatePlaylistModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg p-6 w-full max-w-sm relative">
        <button className="absolute top-2 right-2 text-neutral-400 hover:text-white" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 className="text-white text-lg font-semibold mb-4">Tạo Playlist mới</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên playlist"
          className="w-full px-4 py-2 rounded-md mb-4 bg-neutral-700 text-white outline-none"
        />
        <button
          onClick={handleCreate}
          className="w-full bg-green-500 text-black font-bold py-2 rounded-md hover:opacity-80 transition"
        >
          Tạo
        </button>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
