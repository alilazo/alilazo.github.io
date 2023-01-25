//check if the user is on mobile
const isMobile = () => {
    if (window.innerWidth < 768) {
      console.log("Mobile");
      return true;
    }
}

// function to show projects
const showProjects = (projects, start, end) => {
  for (let i = start; i < end; i++) {
      projects[i].style.display = "block";
      console.log("Projects Shown: " + i);
  }
}

// function to hide the "load more" button when all projects have been shown
const hideLoadMoreBtn = (loadMoreBtn, projectsLength, totalProjects) => {
  if (totalProjects >= projectsLength) {
      loadMoreBtn.classList.add("hide");
  }
}


//Load more projects btn
function loadMoreProjects () {
    const porjectsOnScreen = 6;
    const loadMoreBtn = document.querySelector(".loadMoreBtn");
    const projects = document.querySelectorAll(".project");
    const projectsLength = projects.length;
    let projectsToShow = porjectsOnScreen;
    let projectsShown = porjectsOnScreen;
    const totalProjects =  projectsShown + projectsToShow;

    hideLoadMoreBtn(loadMoreBtn, projectsLength, totalProjects);
    showProjects(projects, projectsShown, projectsToShow);
}

//Navigation bar autoHideScroll
const autoHideScroll = () => {
    const autohide = document.querySelector('.autohide');
    const navEnabler = document.querySelector('.navig');
    const navbar_height = document.querySelector('.navbar').offsetHeight;
    
    document.body.style.paddingTop = navbar_height + 'px';

    if(autohide){
        let last_scroll_top = 0;
        
        window.addEventListener('scroll', function() {
            navEnabler.classList.remove('navig');
            const scroll_top = window.scrollY;
            
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
    const autohide = document.querySelector('.autohide');
    const headerText = document.querySelector(".headerTitleText");
    const subHeaderText = document.querySelector(".subHeaderText");

    headerText.classList.add("active");
    autohide.classList.add('scrolled-down');
    headerText.addEventListener("transitionend", () => {
        subHeaderText.classList.add("active");
    });
}

//reveal class scroll animation
const reveal = () => {
    const reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
      const windowHeight = window.innerHeight;
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
const revealLR = (className) => {
    const reveals = document.querySelectorAll('${className}');
    const elementVisible = 150;
    const windowHeight = window.innerHeight;

    reveals.forEach((reveal) => {
      var elementTop = reveal.getBoundingClientRect().top;
      
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add("active");
      } else {
        reveal.classList.remove("active");
      }
    })
}

isMobile();
window.addEventListener("load", () => onLoadFunction());
window.addEventListener("scroll", () => reveal("reveal"));
window.addEventListener("scroll", () => reveal("revealLR"));