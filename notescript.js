// ====== Placeholder Logic ======
function updatePlaceholders() {
  const title = document.getElementById("note-title");
  const body = document.getElementById("note-body");

  if (!title.value.trim()) {
    title.placeholder = "Title";
  }

  if (body.innerText.trim() === "") {
    body.setAttribute("data-placeholder", "Start writing..");
  } else {
    body.removeAttribute("data-placeholder");
  }
}

document.getElementById("note-title").addEventListener("input", updatePlaceholders);
document.getElementById("note-body").addEventListener("input", updatePlaceholders);
document.addEventListener("DOMContentLoaded", updatePlaceholders);

// ====== Editor State ======
const editor = document.getElementById("note-body");
let currentFontFamily = "Arial";
let currentFontSize = "12px";
let currentColor = "#ffffff";
let savedSelection = null;

function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedSelection = sel.getRangeAt(0);
  }
}

function restoreSelection() {
  if (savedSelection) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedSelection);
  }
}

function applyStyle(command, value = null) {
  document.execCommand(command, false, value);
  editor.focus();
}

// ====== Font Family ======
document.getElementById("font-family").addEventListener("change", function () {
  currentFontFamily = this.value;
  applyStyle("fontName", currentFontFamily);
});

// ====== Font Size ======
document.getElementById("font-size").addEventListener("change", function () {
  const pxToSize = {
    "16px": "3",
    "18px": "4",
    "20px": "5",
    "24px": "6"
  };
  currentFontSize = this.value;
  applyStyle("fontSize", pxToSize[this.value] || "3");

  Array.from(editor.querySelectorAll("font[size]")).forEach(el => {
    el.removeAttribute("size");
    el.style.fontSize = currentFontSize;
  });
});

// ====== Font Color ======
document.querySelectorAll(".color-swatch").forEach(swatch => {
  swatch.addEventListener("mousedown", saveSelection);
  swatch.addEventListener("click", () => {
    restoreSelection();
    currentColor = swatch.getAttribute("data-color");
    applyStyle("foreColor", currentColor);
    document.getElementById("color-palette").style.display = "none";
  });
});

document.getElementById("color-button").addEventListener("click", () => {
  const palette = document.getElementById("color-palette");
  palette.style.display = palette.style.display === "block" ? "none" : "block";
});

// ====== Continuous Color Typing ======
document.getElementById("note-body").addEventListener("keypress", function () {
  applyStyle("foreColor", currentColor);
});

// ====== Formatting Buttons ======
function formatText(command) {
  applyStyle(command);
}

// ====== Image Handling ======

document.getElementById("add-image-btn").addEventListener("click", () => {
  document.getElementById("image-input").click();
});

document.getElementById("image-input").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const fullContainer = document.createElement("div");
    fullContainer.style.display = "inline-block";
    fullContainer.style.position = "relative";

    const img = document.createElement("img");
    img.src = e.target.result;
    img.style.maxWidth = "300px";
    img.style.margin = "10px";
    img.contentEditable = false;

    // 🗑️ Custom Trash Icon
    const trashIcon = document.createElement("img");
    trashIcon.src = "redtrashbin.png"; // Path to your image
    trashIcon.alt = "Delete";
    trashIcon.title = "Delete image";
    trashIcon.style.width = "20px";
    trashIcon.style.height = "20px";
    trashIcon.style.position = "absolute";
    trashIcon.style.top = "0";
    trashIcon.style.right = "-15px";
    trashIcon.style.cursor = "pointer";
    trashIcon.style.background = "white";
    trashIcon.style.border = "1px solid #ccc";
    trashIcon.style.borderRadius = "50%";
    trashIcon.style.padding = "2px";
    trashIcon.style.boxShadow = "0 0 4px rgba(0,0,0,0.2)";

    trashIcon.addEventListener("click", () => fullContainer.remove());

    // 🔘 Round Resize Handle
    const resizeHandle = document.createElement("div");
    resizeHandle.style.width = "12px";
    resizeHandle.style.height = "12px";
    resizeHandle.style.position = "absolute";
    resizeHandle.style.right = "-10px";
    resizeHandle.style.bottom = "0";
    resizeHandle.style.cursor = "nwse-resize";
    resizeHandle.style.background = "#ccc";
    resizeHandle.style.borderRadius = "50%";

    resizeHandle.onmousedown = function (e) {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = img.offsetWidth;

      function doDrag(e) {
        img.style.width = `${startWidth + e.clientX - startX}px`;
      }

      function stopDrag() {
        window.removeEventListener("mousemove", doDrag);
        window.removeEventListener("mouseup", stopDrag);
      }

      window.addEventListener("mousemove", doDrag);
      window.addEventListener("mouseup", stopDrag);
    };

    fullContainer.appendChild(img);
    fullContainer.appendChild(trashIcon);
    fullContainer.appendChild(resizeHandle);

    // Add image and an empty line after
    editor.appendChild(fullContainer);

    // 🆕 Add new empty paragraph for writing after image
    const newLine = document.createElement("p");
    newLine.innerHTML = "<br>";
    editor.appendChild(newLine);

    // Set cursor to the new line
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(newLine, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    editor.focus();
  };

  reader.readAsDataURL(file);
});


// ====== Undo / Redo ======
document.getElementById("undo-btn").addEventListener("click", () => {
  document.execCommand("undo", false, null);
});
document.getElementById("redo-btn").addEventListener("click", () => {
  document.execCommand("redo", false, null);
});

// ====== Save Note ======
document.getElementById("save-btn").addEventListener("click", () => {
  const title = document.getElementById("note-title").value.trim();
  const content = document.getElementById("note-body").innerHTML;

  if (!title && !content.trim()) {
    alert("Cannot save an empty note.");
    return;
  }

  const note = {
    title,
    content,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem("note_" + title, JSON.stringify(note));

  const msg = document.createElement("div");
  msg.textContent = "✅ Note saved!";
  msg.style.position = "fixed";
  msg.style.bottom = "20px";
  msg.style.right = "20px";
  msg.style.backgroundColor = "#4CAF50";
  msg.style.color = "white";
  msg.style.padding = "10px 20px";
  msg.style.borderRadius = "6px";
  msg.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  msg.style.zIndex = "1000";
  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 3000);
});