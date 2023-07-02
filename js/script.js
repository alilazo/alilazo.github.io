document.addEventListener('DOMContentLoaded', function() {
  //Cursor
  const bigBall = document.querySelector('.cursor__ball--big');
  const smallBall = document.querySelector('.cursor__ball--small');
  const hoverables = document.querySelectorAll('.hoverable');
  bigBall.style.mixBlendMode = "difference";
  smallBall.style.mixBlendMode = "difference";

  if(!isMobile()){
    //get the cursor class
    const cursor = document.querySelector(".cursor");
    cursor.style.opacity = 1;

  }

  // Move the cursor
  function onMouseMove(e) {
    const bigBallR = bigBall.children[0].children[0].getAttribute("r");
    const smallBallR = smallBall.children[0].children[0].getAttribute("r");

    if(!isMobile()){
      bigBall.style.opacity = 1;
      smallBall.style.opacity = 1;
    }
    if(!isMobile()){
      TweenMax.to(bigBall, 0.5, {
        x: e.x - bigBallR-1,
        y: e.y - bigBallR-2
      });
      TweenMax.to(smallBall, 0.1, {
        x: e.x - smallBallR,
        y: e.y - smallBallR -10
      });
    }
  }

  document.body.addEventListener('mousemove', onMouseMove);

  function onMouseHover(e) {
    if(!isMobile()){
      TweenMax.to(bigBall, 0.3, {
        scale: 0,
        opacity: 0
      });
      TweenMax.to(smallBall, 0.2, {
        scale: 0,
        opacity: 0
      });
    }

    //get the child elements of e
    let children = [];
    let innerText = [];
    for(let i = 0; i < e.currentTarget.children.length; i++) {
      if(!e.currentTarget.children[i].classList.contains("inner-text")) {
        children.push(e.currentTarget.children[i]);
      } else if(e.currentTarget.children[i].classList.contains("inner-text")) {
        innerText.push(e.currentTarget.children[i]);
      }
    }
    //make a variable that gets all the childrent of .skillList
    const skillListChildren = document.querySelector(".skillList").children;
    for(let i = 0; i < children.length; i++) {
      //iterate throught the skillListChildren and check if the e parent element has skillListChildren
      for(let j = 0; j < skillListChildren.length; j++) {
        if(e.currentTarget.parentElement == skillListChildren[j]) {
          TweenMax.to(children[i], 0.3, {
            opacity: 0
          });
        }
      }
    }

    for(let i = 0; i < innerText.length; i++) {
      TweenMax.to(innerText[i], 0.3, {
        opacity: 1
      });
    }
  }

  function onMouseHoverOut(e) {
    if(!isMobile()){
      TweenMax.to(bigBall, 0.3, {
        scale: 1,
        opacity: 1
      });
      TweenMax.to(smallBall, 0.3, {
        scale: 1,
        opacity: 1
      });
    }

    //get the child elements of e
    let children = [];
    let innerText = [];
    for(let i = 0; i < e.currentTarget.children.length; i++) {
      if(!e.currentTarget.children[i].classList.contains("inner-text")) {
        children.push(e.currentTarget.children[i]);
      } else if(e.currentTarget.children[i].classList.contains("inner-text")) {
        innerText.push(e.currentTarget.children[i]);
      }
    }
    //make a variable that gets all the childrent of .skillList
    const skillListChildren = document.querySelector(".skillList").children;
    for(let i = 0; i < children.length; i++) {
      //iterate throught the skillListChildren and check if the e parent element has skillListChildren
      for(let j = 0; j < skillListChildren.length; j++) {
        if(e.currentTarget.parentElement == skillListChildren[j]) {
          TweenMax.to(children[i], 0.4, {
            opacity: 1
          });
        }
      }
    }
    for(let i = 0; i < innerText.length; i++) {
      TweenMax.to(innerText[i], 0.4, {
        opacity: 0,
      });
    }
  }

  for (let i = 0; i < hoverables.length; i++) {
    hoverables[i].addEventListener('mouseenter', onMouseHover);
    hoverables[i].addEventListener('mouseleave', onMouseHoverOut);
  }

  initilizeHeadings();

});

const initilizeHeadings = () => {
  //init the picture on the header
  const picture = document.querySelector(".backgroundHeaderImage");
  const currentDirectory = window.location.pathname;
  const currentDirectoryParent = currentDirectory.substring(0, currentDirectory.lastIndexOf("/"));
  const picturePath = currentDirectoryParent + "/pics/IMG2A.jpg";
  picture.style.backgroundImage = "url('" + picturePath + "')";

  //init the animations on the header
  const headerText = document.querySelector(".headerTitleText");
  const headerTextActive = document.querySelector(".headerTitleText.active");

  if(headerText) {
    headerText.style.transfom = "translateY(150px)";
  }
  if(headerTextActive) {
    headerTextActive.style.transfom = "translateY(0)";
  }

}


//check if the user is on mobile
const isMobile = () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
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
    const porjectsOnScreen = 3;
    const loadMoreBtn = document.querySelector(".loadMoreBtn");
    const projects = document.querySelectorAll(".project");
    const projectsLength = projects.length;
    let projectsToShow = projectsLength;
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
    const backgroundHeaderImage = document.querySelector(".backgroundHeaderImage");

    headerText.classList.add("active");
    backgroundHeaderImage.classList.add("active");
    autohide.classList.add('scrolled-down');
    headerText.addEventListener("transitionend", () => {
        subHeaderText.classList.add("active");
    });
    const typed = new Typed('.typewriter', {
        strings: ['As a senior Computer Science student at Texas A&amp;M-Corpus Christi, I am eager to transition into a full-time role in the field. With a passion for programming and a constant desire to learn and improve, I am confident in my ability to contribute to a company\'s success. My 21 years of experience and hardworking attitude make me a valuable asset to any team. I have a strong background in Java, C++, HTML, CSS, JavaScript and have worked with front-end and back-end frameworks such as MongoDB, ExpressJS, ReactJS, and NodeJS through my experience at IBM during my Accelerate Program.'],
        typeSpeed: 1, // Adjust the typing speed (in milliseconds)
        loop: false, // Set to true if you want the typewriter effect to loop
        cursorChar: '|',
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
    const reveals = document.querySelectorAll(className);
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


window.addEventListener("DOMContentLoaded", () => onLoadFunction());
window.addEventListener("load", () => isMobile());
window.addEventListener("scroll", () => reveal("reveal"));
window.addEventListener("scroll", () => reveal("revealLR"));
//startTypeOnAbout is called in the reveal function because it checks if the element has the class "active"
//window.addEventListener("scroll", () => startTypeOnAbout());