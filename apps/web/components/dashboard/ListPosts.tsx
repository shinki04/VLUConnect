import React from "react";
import { InfinitePostsList } from "./InfinitePostsList";

function ListPosts() {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Bài viết</h2>
      <InfinitePostsList />
    </div>
  );
}

export default ListPosts;
