//Load more projects btn
function loadMoreProjects () {
    var loadMoreBtn = document.querySelector(".loadMoreBtn");
    var projects = document.querySelectorAll(".project");
    var projectsLength = projects.length;
    var projectsToShow = 3;
    var projectsShown = 3;
    var totalProjects =  projectsShown + projectsToShow;

    if (totalProjects >= projectsLength)
        loadMoreBtn.classList.add("hide");

    for (var i = projectsShown; i < projectsLength; i++) {
        projects[i].style.display = "block";
        console.log("Projects Shown: " + i);
    }
}

//Navigation bar autoHideScroll
const autoHideScroll = () => {
    autohide = document.querySelector('.autohide');
    navEnabler = document.querySelector('.navig');
    navbar_height = document.querySelector('.navbar').offsetHeight;
    document.body.style.paddingTop = navbar_height + 'px';

    if(autohide){
        var last_scroll_top = 0;
        window.addEventListener('scroll', function() {
            navEnabler.classList.remove('navig');
            let scroll_top = window.scrollY;
            if(scroll_top < last_scroll_top) {
                autohide.classList.remove('scrolled-down');
                autohide.classList.add('scrolled-up');
            } else {
                autohide.classList.remove('scrolled-up');
                autohide.classList.add('scrolled-down');
            }
            last_scroll_top = scroll_top;
        });
    }
}

//When the screen leads start the animations
const onLoadFunction = () => { 
    autoHideScroll();
    var autohide = document.querySelector('.autohide');
    var headerText = document.querySelector(".headerTitleText");
    var subHeaderText = document.querySelector(".subHeaderText");

    headerText.classList.add("active");
    autohide.classList.add('scrolled-down');
    headerText.addEventListener("transitionend", function() {
        subHeaderText.classList.add("active");
    });
}

window.addEventListener("load", () => onLoadFunction());


//reveal class scroll animation
const reveal = () => {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
      var windowHeight = window.innerHeight;
      var elementTop = reveals[i].getBoundingClientRect().top;
      var elementVisible = 150;
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add("active");
      } else {
        reveals[i].classList.remove("active");
      }
    }
}

//reveal class scroll animation
const revealLR = () => {
    var reveals = document.querySelectorAll(".revealLR");
    for (var i = 0; i < reveals.length; i++) {
      var windowHeight = window.innerHeight;
      var elementTop = reveals[i].getBoundingClientRect().top;
      var elementVisible = 150;
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add("active");
      } else {
        reveals[i].classList.remove("active");
      }
    }
}

window.addEventListener("scroll", reveal);
window.addEventListener("scroll", revealLR);
reveal();
revealLR();