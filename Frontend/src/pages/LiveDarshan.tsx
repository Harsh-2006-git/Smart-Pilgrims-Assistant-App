import React from "react";
// @ts-ignore
import Header from "../components/Header";
import Footer from "../components/Footer";

const LiveDarshan = () => {
  const videoId = "wOTIca3fN6I"; // Your live video ID

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-28">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl md:text-5xl font-black text-center mb-8 text-gray-900 px-4 leading-tight">
          🔴 Live Darshan - Mahakaleshwar Jyotirlinga
        </h1>
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl mb-8 border border-gray-200">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="Live Darshan"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className="mb-8 text-lg text-center max-w-4xl mx-auto leading-relaxed text-gray-700">
          <p className="mb-4">
            Experience the divine blessings of Lord Shiva from the sacred
            <strong> Mahakaleshwar Jyotirlinga Temple</strong> in Ujjain. This
            temple is one of the twelve Jyotirlingas and holds great spiritual
            importance in Hinduism. It is the only Jyotirlinga facing south
            (Dakshinamukhi), representing a unique form of Lord Shiva.
          </p>
        </div>
        <div className="text-center text-gray-500 text-sm">
          Powered by BhaktiLive & YouTube API | © {new Date().getFullYear()}{" "}
          Mahakaleshwar Darshan
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LiveDarshan;
