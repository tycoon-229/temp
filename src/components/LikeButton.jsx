"use client";

import { useState } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

const LikeButton = ({ songId }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <button
      onClick={handleLike}
      className="text-neutral-400 hover:text-red-500 transition"
      title={isLiked ? "Unlike" : "Like"}
    >
      {isLiked ? (
        <AiFillHeart size={24} className="text-red-500" />
      ) : (
        <AiOutlineHeart size={24} />
      )}
    </button>
  );
};

export default LikeButton;
