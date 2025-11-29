"use client";

import useTrackStats from "@/hooks/useTrackStats";

const MusicLogger = ({ song }) => {
  // Gọi hook theo dõi tại đây
  // Khi bài hát thay đổi, hook này sẽ đếm 5s và lưu vào DB
  useTrackStats(song);

  return null; // Không render giao diện
};

export default MusicLogger;