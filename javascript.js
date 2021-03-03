console.log("Home Javascript");

//keeps track if you've been on the page
var firstTime = 0;

$("#navButton a").click(function(){
    firstTime = 1;
});

//Sidebar control
const openSidebar = () => {
    document.getElementById("Sidebar").style.width = "100%";
    document.getElementById("Sidebar").style.display = "block";
};

const closeSidebar = () => {
    document.getElementById("Sidebar").style.display = "none";
};

var keys = {37: 1, 38: 1, 39: 1, 40: 1};

const preventDefault = (e) => e.preventDefault();


function preventDefaultForScrollKeys(e) {
    if (keys[e.keyCode]) {
        preventDefault(e);
        return false;
    }
}

// modern Chrome requires { passive: false } when adding event
var supportsPassive = false;
try {
    window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
        get: function () { supportsPassive = true; } 
    }));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

//Disables scroll function
function disableScroll() {
    $('body').addClass('stop-scrolling')
    window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
    window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
    window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
    window.addEventListener('keydown', preventDefaultForScrollKeys, false);
    console.log("Disabled scroll");
}


//Enables scroll function 
function enableScroll() {
    window.removeEventListener('DOMMouseScroll', preventDefault, false);
    window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
    window.removeEventListener('touchmove', preventDefault, wheelOpt);
    window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
    console.log("Enabled scroll");
}

if(firstTime === 0){
    $(document).ready(function(){
        disableScroll();
        function fadeoutSlow(){
            $(".loader-wrapper").fadeOut("slow");
            enableScroll();
            $('body').removeClass('stop-scrolling')
        }
        window.setTimeout(fadeoutSlow, 2000);
    });
}