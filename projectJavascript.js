console.log("Project Javascript");
const goToHandshake = () => open("https://tamucc.joinhandshake.com/users/20542267");
const goToInspirationalQuote = () => open("https://alilazo.github.io/Inspiration-Quotes/");
const goToNumberGuesser = () => open("https://alilazo.github.io/number-guesser/index.html");
const openGitHub = (url) => open(url);

const openModal = (name) => document.getElementById(name).style.display='block';

const closeModal = (name) => document.getElementById(name).style.display='none';

const openSidebar = () => {
    document.getElementById("Sidebar").style.width = "100%";
    document.getElementById("Sidebar").style.display = "block";
};
const closeSidebar = () => {
    document.getElementById("Sidebar").style.display = "none";
};