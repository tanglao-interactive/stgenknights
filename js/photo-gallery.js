(function () {
    "use strict";

    var dialog = document.querySelector(".photo-lightbox");

    if (!dialog || typeof dialog.showModal !== "function") {
        return;
    }

    var image = dialog.querySelector(".photo-lightbox-image");
    var title = dialog.querySelector("#photo-lightbox-title");
    var caption = dialog.querySelector(".photo-lightbox-caption p");
    var closeButton = dialog.querySelector(".photo-lightbox-close");
    var previousButton = dialog.querySelector(".photo-lightbox-previous");
    var nextButton = dialog.querySelector(".photo-lightbox-next");
    var position = dialog.querySelector(".photo-lightbox-position");
    var triggers = Array.prototype.slice.call(document.querySelectorAll(".photo-lightbox-trigger"));
    var activeTrigger = null;
    var activeIndex = 0;

    function showPhoto(index) {
        activeIndex = (index + triggers.length) % triggers.length;
        activeTrigger = triggers[activeIndex];
        image.src = activeTrigger.href;
        image.alt = activeTrigger.querySelector("img").alt;
        title.textContent = activeTrigger.dataset.photoTitle;
        caption.textContent = activeTrigger.dataset.photoCaption;
        position.textContent = "Photo " + (activeIndex + 1) + " of " + triggers.length;
        previousButton.hidden = triggers.length < 2;
        nextButton.hidden = triggers.length < 2;
    }

    triggers.forEach(function (trigger, index) {
        trigger.addEventListener("click", function (event) {
            event.preventDefault();
            showPhoto(index);
            dialog.showModal();
            document.body.classList.add("lightbox-open");
            closeButton.focus();
        });
    });

    function closeDialog() {
        dialog.close();
    }

    closeButton.addEventListener("click", closeDialog);
    previousButton.addEventListener("click", function () { showPhoto(activeIndex - 1); });
    nextButton.addEventListener("click", function () { showPhoto(activeIndex + 1); });

    dialog.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showPhoto(activeIndex - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            showPhoto(activeIndex + 1);
        }
    });

    dialog.addEventListener("click", function (event) {
        if (event.target === dialog) {
            closeDialog();
        }
    });

    dialog.addEventListener("close", function () {
        document.body.classList.remove("lightbox-open");
        image.removeAttribute("src");

        if (activeTrigger) {
            activeTrigger.focus();
        }
    });
}());
