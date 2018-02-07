var ButtonEnum = {
    PLACE: 0,
    TRANSITION: 1,
    EDGE: 2,
    NONE: 3
};


var canvas;
var canvasEdit;
var ctx;
var ctxEdit;
var dpi;

var isMouseDown = false;
const arrowImgPath = "../Content/Images/Arrow.png";
const arrowImgDownPath = "../Content/Images/Arrow-down.png";

var petriNet = {
    nodes:[],
    edges:[]
};

function raiseError(msg) {
    const div = document.createElement("div");
    div.className = "error-message";
    div.style.position = "absolute";
    div.style.top = "5px";
    div.style.left = "5px";
    div.innerText = msg;
    const area = document.getElementById("drawing-area");
    area.appendChild(div);
    setTimeout(() => area.removeChild(div),3000);
}

var idGenerator = {
    id: 0,
    getId() {
        return "modelId" + this.id++;
    }
};
var controls = {
    selectedButton: null,
    isMouseDo
    select(button) {
        if (this.selectedButton === button) {
            this.clearSelection();
            return;
        }
        if (this.selectedButton) {
            this.selectedButton.classList.remove("btn-selected");
        }
        button.className += " btn-selected";
        this.selectedButton = button;
    },
    getCode() {
        if (this.selectedButton)
            return parseInt(this.selectedButton.value);
    },
    clearSelection() {
        if (this.selectedButton) {
            this.selectedButton.classList.remove("btn-selected");
            this.selectedButton = null;
        }
    }
};

var defaultName = {
    placeNodeId : 1,
    transitionNodeId : 1,
    getPlaceName() {
        return "Place" + this.placeNodeId++;
    },
    getTransitionName() {
        return "Transition" + this.transitionNodeId++;
    }
};

var modelView = {
    nodes: [],
    updateNode(node) {
        const nodeInfo = this.nodes.find((el) => {
            return el.node === node;
        });
        console.log("Find: " + nodeInfo);
        nodeInfo.nodeView.innerHTML = "";
        createNodeViewContent(nodeInfo.nodeView, nodeInfo.node);
    },
    addNode(newNode) {
        const modelContainer = document.getElementById("model-view");
        const nodeContainer = document.createElement("div");
        nodeContainer.className = "node-container";
        createNodeViewContent(nodeContainer, newNode);
        modelContainer.appendChild(nodeContainer);
        this.nodes.push({ node: newNode, nodeView: nodeContainer });
    }
};

function createNodeViewContent(parent,node) {
    const nodeNameContainer = document.createElement("div");
    nodeNameContainer.className = "node-name-container";
    const img = document.createElement("img");
    img.src = arrowImgDownPath;
    
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "model-input";
    nameInput.value = node.name;
    nameInput.onchange = () => {
        if (nameInput.value === "") {
            nameInput.value = node.name;
        }
        else {
            node.name = nameInput.value;
            node.inputs.forEach((edge) => {
                modelView.updateNode(edge.nodeFrom);
            });
            node.outputs.forEach((edge) => {
                modelView.updateNode(edge.nodeTo);
            });
            redraw();
        }
    };
    nodeNameContainer.appendChild(img);
    nodeNameContainer.appendChild(nameInput);
    parent.appendChild(nodeNameContainer);


    const nodeAttrContainer = document.createElement("div");
    nodeAttrContainer.className = "node-attr-container";
    nodeAttrContainer.id = idGenerator.getId();

    let toggleImg = true;
    img.onclick = (e) => {
        $("#" + nodeAttrContainer.id).toggle();
        console.log(img.src);
        if (toggleImg) {
            img.src = arrowImgPath;
            toggleImg = false;
        }
        else {
            img.src = arrowImgDownPath;
            toggleImg = true;
        }
    };
    const attrList = document.createElement("ul");
    attrList.className = "attr-list";

    if (node.nodeType === "Place") {
        const input = createNodeAttribute("Tokens: ", node.tokensCount, attrList);
        input.onchange = () => {
            if (input.value === "") {
                input.value = node.tokensCount;
            }
            else {
                node.tokensCount = input.value;
                redraw();
            }
        };
    }
    if (node.nodeType === "Transition") {
        const inputTimeDelta = createNodeAttribute("Time delta: ", node.timeDelta, attrList);
        inputTimeDelta.onchange = () => {
            if (inputTimeDelta.value === "") {
                inputTimeDelta.value = node.timeDelta;
            }
            else {
                node.timeDelta = inputTimeDelta.value;
                redraw();
            }
        };
        const inputFine = createNodeAttribute("Fine: ", node.fine, attrList);
        inputFine.onchange = () => {
            if (inputFine.value === "") {
                inputFine.value = node.fine;
            }
            else {
                node.fine = inputFine.value;
                redraw();
            }
        };

    }

    const inputsLi = document.createElement("li");
    const expDivInputs = createExpandable("Inputs", inputsLi);
    const connListInputs = createInputList(node.inputs, inputsLi);
    connListInputs.id = idGenerator.getId();
    

    const outputsLi = document.createElement("li");
    const expDivOutputs = createExpandable("Outputs", outputsLi);
    const connListOutputs = createOutputList(node.outputs, outputsLi);
    connListOutputs.id = idGenerator.getId();
    

    attrList.appendChild(inputsLi);
    attrList.appendChild(outputsLi);

    nodeAttrContainer.appendChild(attrList);
    parent.appendChild(nodeAttrContainer);
}

function createInputList(connList,parent) {
    const divWrapper = document.createElement("div");
    divWrapper.className = "conn-list-container";
    const ul = document.createElement("ul");
    for (let conn of connList) {
        
        const inputWeight = createNodeAttribute(conn.nodeFrom.name, conn.weight, ul);
        inputWeight.onchange = (e) => {
            if (inputWeight.value === "") {
                inputWeight.value = conn.weight;
            }
            else {
                conn.weight = inputWeight.value;
                modelView.updateNode(conn.nodeFrom);
                redraw();
            }
        };
    }
    divWrapper.appendChild(ul);
    parent.appendChild(divWrapper);
    return divWrapper;
}

function createOutputList(connList, parent) {
    const divWrapper = document.createElement("div");
    divWrapper.className = "conn-list-container";
    const ul = document.createElement("ul");
    for (let conn of connList) {

        const inputWeight = createNodeAttribute(conn.nodeTo.name, conn.weight, ul);
        inputWeight.onchange = (e) => {
            if (inputWeight.value === "") {
                inputWeight.value = conn.weight;
            }
            else {
                conn.weight = inputWeight.value;
                modelView.updateNode(conn.nodeTo);
                redraw();
            }
        };
    }
    divWrapper.appendChild(ul);
    parent.appendChild(divWrapper);
    return divWrapper;
}

function createExpandable(text,parent) {
    const div = document.createElement("div");
    const img = document.createElement("img");
    img.src = arrowImgDownPath;

    const span = document.createElement("span");
    span.textContent = text;
    div.appendChild(img);
    div.appendChild(span);
    parent.appendChild(div);
    return div;
}
function fix_dpi(can) {
    let style = {
        height() {
            return getComputedStyle(can).getPropertyValue('height').slice(0, -2);
        },
        width() {
            return getComputedStyle(can).getPropertyValue('width').slice(0, -2);
        }
    };
    can.setAttribute('width', style.width() * dpi);
    can.setAttribute('height', style.height() * dpi);
}

function getMousePos(e) {
    var drawingArea = document.getElementById("drawing-area");
    
    return {
        x: e.clientX - drawingArea.offsetLeft + drawingArea.scrollLeft,
        y: e.clientY - drawingArea.offsetTop + drawingArea.scrollTop
    };
}
function initCanvas() {
    canvas = document.getElementById("canvas");
    canvasEdit = document.getElementById("canvas-edit");
    ctx = canvas.getContext("2d");
    ctxEdit = canvasEdit.getContext("2d");
    dpi = window.devicePixelRatio;
    fix_dpi(canvas);
    fix_dpi(canvasEdit);
    drawGrid();
}



$(document).ready(function () {
    console.log("ready!");
    raiseError("error");
    $("#btn-test").click(function () {
        createModelView();

    });

    $(".btn-draw").click(function () {
        controls.select(this);
    });
    
    $("canvas").mousedown(function (e) {
        var mousePos = getMousePos(e);
        console.log(`${mousePos.x} ${mousePos.y}`);
        switch (controls.getCode()) {
            case ButtonEnum.PLACE:
                var placeNode = new PlaceNode(mousePos.x, mousePos.y);
                petriNet.nodes.push(placeNode);
                controls.clearSelection();
                placeNode.draw();
                placeNode.showNameInput();
                modelView.addNode(placeNode);
                break;
            case ButtonEnum.TRANSITION:
                var transNode = new TransitionNode(mousePos.x, mousePos.y);
                petriNet.nodes.push(transNode);
                controls.clearSelection();
                transNode.draw();
                transNode.showNameInput();
                modelView.addNode(transNode);
                break;
            case ButtonEnum.EDGE:
                var edge = new Edge(mousePos.x, mousePos.y);
                edge.nodeFrom = getSelectedNode(mousePos.x, mousePos.y);
                console.log(edge.nodeFrom);
                if (!edge.nodeFrom) return;
                isMouseDown = true;
                drawEdgePoint(mousePos.x, mousePos.y, "blue",ctxEdit);
                petriNet.edges.push(edge);
                
                break;
        }
        
    });
    $("#drawing-area").mousemove(function (e) {
        if (!isMouseDown) return;
        var mousePos = getMousePos(e);
        switch (controls.getCode()) {
            case ButtonEnum.EDGE:
                let edge = petriNet.edges[petriNet.edges.length - 1];
                ctxEdit.clearRect(0, 0, canvasEdit.width, canvasEdit.height);
                drawEdgePoint(edge.startX, edge.startY,"blue",ctxEdit);
                drawLine(edge.startX, edge.startY, mousePos.x, mousePos.y, ctxEdit);
                drawEdgePoint(mousePos.x, mousePos.y,"yellow", ctxEdit);
                break;
        }
        
    });
    $("#drawing-area").mouseup(function (e) {
        if (!isMouseDown) return;
        var mousePos = getMousePos(e);
        isMouseDown = false;
        switch (controls.getCode()) {
            case ButtonEnum.EDGE:
                ctxEdit.clearRect(0, 0, canvasEdit.width, canvasEdit.height);
                let edge = petriNet.edges[petriNet.edges.length - 1];
                edge.nodeTo = getSelectedNode(mousePos.x, mousePos.y);
                if (!edge.nodeTo) {
                    petriNet.edges.pop();
                    return;
                }

                if (edge.nodeTo.nodeType === edge.nodeFrom.nodeType) {
                    petriNet.edges.pop();
                    return;
                }
                edge.nodeFrom.outputs.push(edge); 
                edge.nodeTo.inputs.push(edge);
                edge.endX = mousePos.x;
                edge.endY = mousePos.y;
                edge.draw();
                edge.showWeigthInput();
                modelView.updateNode(edge.nodeTo);
                modelView.updateNode(edge.nodeFrom);
        }
    });
    initCanvas();
});

function Edge(x, y) {
    this.startX = x;
    this.startY = y;
    this.weight = 0;
    this.getMiddle = () => {
        return {
            x: (this.startX + this.endX) / 2,
            y: (this.startY + this.endY) / 2
        };
    };
    this.draw = () => {
        drawEdgePoint(this.startX, this.startY,"blue", ctx);
        drawEdgePoint(this.endX, this.endY,"yellow", ctx);
        drawLine(this.startX, this.startY, this.endX, this.endY, ctx);
    };
    
    this.showWeigthInput = () => {
        let mid = this.getMiddle();
        let input = createInput(mid.x, mid.y + 10, 30);
        input.value = 0;
        document.getElementById("drawing-area").appendChild(input);
        input.focus();
        input.onblur = (e) => {
            if (input.value) {
                this.weight = input.value;
            }
            this.textPos = input.offsetTop;
            this.drawWeight();
            modelView.updateNode(this.nodeTo);
            modelView.updateNode(this.nodeFrom);
            document.getElementById("drawing-area").removeChild(input);
        };
        input.onkeydown = (e) => {
            if (e.keyCode === 13)
                input.blur();
        };
    };
    this.drawWeight = () => {
        drawText(this.weight, this.getMiddle().x, this.textPos);
    };
}
function PlaceNode(x,y) {
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.nodeType = "Place";
    this.tokensCount = 0;
    this.textPos = 0;
    this.inputs = [];
    this.outputs = [];
    this.draw = () => {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "black";
        ctx.stroke();
        
    };
    this.showNameInput = () => {
        let input = createInput(this.x - 1.5 * this.radius, this.y + this.radius, 90);
        input.id = "input-name";
        this.name = defaultName.getPlaceName();
        input.value = this.name;
        document.getElementById("drawing-area").appendChild(input);
        input.focus();
        let prevBlur = 0;
        input.onblur = (e) => {
            if (prevBlur === 0) {
                input.focus();
                prevBlur = 1;
                return;
            }
            if (input.value) {
                this.name = input.value;
            }
            this.textPos = input.offsetTop;
            this.drawName();
            modelView.updateNode(this);
            document.getElementById("drawing-area").removeChild(input);
            
        };
        input.onkeydown = (e) => {
            if (e.keyCode === 13)
                input.blur();
        };
    };
    this.drawName = () => {
        drawText(this.name, x, this.textPos);
    };
    this.checkBoundaries = (x, y) => {
        return x > this.x - this.radius && x < this.x + this.radius && y > this.y - this.radius
            && y < this.y + this.radius;
    };
}

function TransitionNode(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.attributeHeight = 15;
    this.nodeType = "Transition";
    this.timeDelta = 0;
    this.fine = 0;
    this.textPos = 0;
    this.inputs = [];
    this.outputs = [];
    this.draw = () => {
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.stroke();

        
    };
    this.showNameInput = () => {
        let size = this.height / 2;
        var input = createInput(this.x + this.width / 2 - 1.5 * size, this.y + this.height / 2 + size, 90);
        input.id = "input-name";
        this.name = defaultName.getTransitionName();
        input.value = this.name;
        document.getElementById("drawing-area").appendChild(input);
        input.focus();
        let whatever = 0;
        input.onblur = (e) => {
            if (whatever === 0) {
                input.focus();
                whatever = 1;
                return;
            }
            if (input.value) {
                this.name = input.value;
            }
            this.textPos = input.offsetTop;
            this.drawName();
            modelView.updateNode(this);
            document.getElementById("drawing-area").removeChild(input);
        };
        input.onkeydown = (e) => {
            if (e.keyCode === 13)
                input.blur();
        };
    };
    this.drawName = () => {
        drawText(this.name, x + this.width / 2, this.textPos);
    };
    this.checkBoundaries = (x, y) => {
        return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
    };
}





function createNodeAttribute(labelText,inputValue,parent) {
    let item = document.createElement("li");
    let input = document.createElement("input");
    let label = document.createElement("span");
    input.className = "model-input";
    input.type = "text";
    input.value = inputValue;
    label.textContent = labelText;
    label.className = "attr-label";
    item.appendChild(label);
    item.appendChild(input);
    parent.appendChild(item);
    return input;
}

function createInput(x, y,size) {
    var input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.left = x + "px";
    input.style.top = y + "px";
    input.style.minWidth = size+"px";
    input.style.maxWidth = size+"px";
    
    document.getElementById("drawing-area").appendChild(input);
    return input;
}

function drawText(msg, x, y) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillStyle = "black";
    ctx.font = "14px sans-serif";
    ctx.fillText(msg, x, y);
}

function drawGrid() {
    
    const gridNodeSize = 15;
    const canvasGrid = document.getElementById("canvas-grid");
    const ctxGrid = canvasGrid.getContext("2d");
    fix_dpi(canvasGrid);
    ctxGrid.strokeStyle = "#E8E8E8";
    ctxGrid.lineWidth = 1;
    for (let i = 0; i < canvasGrid.height; i = i + gridNodeSize) {
        ctxGrid.moveTo(0, i);
        ctxGrid.lineTo(canvasGrid.width, i);
    }
    for (let i = 0; i < canvasGrid.width; i = i + gridNodeSize) {
        ctxGrid.moveTo(i, 0);
        ctxGrid.lineTo(i, canvasGrid.height);
    }
    ctxGrid.stroke();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let node of petriNet.nodes) {
        node.draw();
        node.drawName();
    }
    for (let edge of petriNet.edges) {
        edge.draw();
        edge.drawWeight();
    }
}
function drawEdgePoint(x, y, color,context) {
    context.beginPath();
    context.strokeStyle = color;
    context.arc(x, y, 5, 0, 2 * Math.PI);
    context.stroke();
}

function drawLine(x1, y1, x2, y2,context) {
    context.beginPath();
    context.strokeStyle="black";
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

function getSelectedNode(x, y) {
    for (let node of petriNet.nodes) {
        if (node.checkBoundaries(x, y)) return node;
    }
    
}

