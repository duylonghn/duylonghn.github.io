function setupSidebarSelection() {
  const find = document.querySelector("#category-find li");
  const card = document.querySelector("#category-card li");
  const add = document.querySelector("#category-add li");
  const quiz = document.querySelector("#category-quiz li");

  if (find && window.location.pathname.includes("index")) {
    find.classList.add("selected");
  }
  if (card && window.location.pathname.includes("Flashcard")) {
    card.classList.add("selected");
  }
  if (add && window.location.pathname.includes("AddWord")) {
    add.classList.add("selected");
  }
  if (quiz && window.location.pathname.includes("Quiztest")) {
    quiz.classList.add("selected");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarSelection();
});