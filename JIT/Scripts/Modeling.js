const NodeTypeEnum = Object.freeze({ PLACE: 0, TRANSITION: 1 });
const ButtonEnum = Object.freeze({ PLACE: 0, TRANSITION: 1, EDGE: 2, NONE: 3 });

var canvas;
var canvasEdit;
var ctx;
var ctxEdit;
var dpi;

const arrowImgPath = "../Content/Images/Arrow.png";
const arrowImgDownPath = "../Content/Images/Arrow-down.png";

const controls = {
    selectedButton: null,
    isMouseDown: false,
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
        else return ButtonEnum.NONE;
    },
    clearSelection() {
        if (this.selectedButton) {
            this.selectedButton.classList.remove("btn-selected");
            this.selectedButton = null;
        }
    }
};


const defaults = {
    placeNodeId: 1,
    transitionNodeId: 1,
    getName(nodeType) {
        switch (nodeType) {
            case NodeTypeEnum.PLACE:
                return "Place" + this.placeNodeId++;
                break;
            case NodeTypeEnum.TRANSITION:
                return "Transition" + this.transitionNodeId++;
                break;
        }
    }
};

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

// ----------- EVENT HANDLERS -----------//

$(document).ready(function () {
    let connInfo = {};
    $(".btn-draw").click(function () {
        controls.select(this);
    });

    $("canvas").mousedown(function (e) {
        const mousePos = getMousePos(e);
        switch (controls.getCode()) {
            case ButtonEnum.PLACE:
                model.addNode(NodeTypeEnum.PLACE, mousePos);
                controls.clearSelection();
                break;
            case ButtonEnum.TRANSITION:
                model.addNode(NodeTypeEnum.TRANSITION, mousePos);
                controls.clearSelection();
                break;
            case ButtonEnum.EDGE:
                connInfo.x1 = mousePos.x;
                connInfo.y1 = mousePos.y;
                controls.isMouseDown = true;
                drawEdgePoint(mousePos.x, mousePos.y, "blue", ctxEdit);
                break;
            case ButtonEnum.NONE:
                modelEditor.clear();
                break;
        }
        

    });
    $("#drawing-area").mousemove(function (e) {
        if (!controls.isMouseDown) return;
        const mousePos = getMousePos(e);
        switch (controls.getCode()) {
            case ButtonEnum.EDGE:
                clearCanvas(canvasEdit);
                drawConnection(connInfo.x1, connInfo.y1, mousePos.x, mousePos.y);
                break;
        }

    });
    $("#drawing-area").mouseup(function (e) {
        if (!controls.isMouseDown) return;
        const mousePos = getMousePos(e);
        controls.isMouseDown = false;
        switch (controls.getCode()) {
            case ButtonEnum.EDGE:
                clearCanvas(canvasEdit);
                connInfo.x2 = mousePos.x;
                connInfo.y2 = mousePos.y;
                const startNodeView = canvasManager.getSelectedNode(connInfo.x1, connInfo.y1);
                const endNodeView = canvasManager.getSelectedNode(connInfo.x2, connInfo.y2);
                if (!(startNodeView && endNodeView)) {
                    raiseError("Invalid Connection");
                    break;
                }
                if (startNodeView.node.nodeType === endNodeView.node.nodeType) {
                    raiseError("Invalied Connection\n(Nodes of the same type cannot be connected)");
                    break;
                }
                if (model.checkExistingEdge(startNodeView.node, endNodeView.node)) {
                    raiseError("Edge already exists");
                    break;
                }
                model.addEdge(startNodeView.node, endNodeView.node, 1, { mousePos: connInfo, start: startNodeView, end: endNodeView });
                break;
        }
        controls.clearSelection();
    });
    initCanvas();
});
// -----------  -----------//

// ----------- VIEW STYLES -----------//
function ViewStyle() {
    this.strokeStyle = 'black';
    this.fillStyle = "white";
    this.font = "14px sans-serif";
    this.textFillStyle="black";
    this.textBoxWidth = 90;
    this.textBaseline = "top";
    this.textAlign = "center";
}

function PlaceViewStyle() {
    this.radius = 30;
}
PlaceViewStyle.prototype = new ViewStyle();

function TransitionViewStyle () {
    this.width = 40;
    this.height = 60;
}
TransitionViewStyle.prototype = new ViewStyle();

function EdgeViewStyle() {
    this.startPointColor="blue";
    this.endPointColor="yellow";
}
EdgeViewStyle.prototype = new ViewStyle();

// -----------  -----------//

// ----------- NODE VIEWS -----------//
function PlaceNodeView(x, y,node) {
    this.x = x;
    this.y = y;
    this.style = new PlaceViewStyle();

    this.node = node;

    this.input = createInput(this.x - 1.5 * this.style.radius, this.y + this.style.radius, this.style);
    this.input.value = this.node.name;
    document.getElementById("drawing-area").appendChild(this.input);
    bindInputBlur(this.input, () => { this.node.setName(this.input.value); hideElement(this.input); modelEditor.editPlace(this.node); });
    this.textPos = { x: this.x, y: this.input.offsetTop };
    hideElement(this.input);

    this.draw = () => {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.style.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.style.fillStyle;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.style.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = this.style.strokeStyle;
        ctx.stroke();
    };
    this.drawName = () => {
        drawText(this.node.name, this.textPos.x, this.textPos.y, this.style);
    };
    this.showInput = () => {
        showElement(this.input);
        focusOnReady(this.input);
    };
    this.checkBoundaries = (x, y) => {
        return x > this.x - this.style.radius && x < this.x + this.style.radius && y > this.y - this.style.radius
            && y < this.y + this.style.radius;
    };
    this.getOutputPoint = () => {
        return {
            x: this.x + this.style.radius,
            y: this.y
        };
    };
    this.getInputPoint = () => {
        return {
            x: this.x - this.style.radius,
            y: this.y
        };
    };
}

function TransitionNodeView(x, y,node) {
    this.x = x;
    this.y = y;
    this.style = new TransitionViewStyle();
    this.node = node;
    
    const size = this.style.height / 2;
    this.input = createInput(this.x + this.style.width / 2 - 1.5 * size, this.y + this.style.height / 2 + size, this.style);
    this.input.value = this.node.name;
    document.getElementById("drawing-area").appendChild(this.input);
    bindInputBlur(this.input, () => { this.node.setName(this.input.value); hideElement(this.input); modelEditor.editTransition(this.node); });
    
    this.textPos = { x: this.x+this.style.width/2, y: this.input.offsetTop };
    hideElement(this.input);

    this.draw = () => {
        ctx.beginPath();
        ctx.fillStyle = this.style.fillStyle;
        ctx.rect(this.x, this.y, this.style.width, this.style.height);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = this.style.strokeStyle;
        ctx.rect(this.x, this.y, this.style.width, this.style.height);
        ctx.stroke();
    };
    this.drawName = () => {
        drawText(this.node.name, this.textPos.x, this.textPos.y, this.style);
    };
    this.showInput = () => {
        showElement(this.input);
        focusOnReady(this.input);
        
    };
    this.checkBoundaries = (x, y) => {
        return x > this.x && x < this.x + this.style.width && y > this.y && y < this.y + this.style.height;
    };
    
    this.getOutputPoint = () => {
        return {
            x: this.x + this.style.width,
            y: this.y + this.style.height / 2
        };
    };
    this.getInputPoint = () => {
        return {
            x: this.x,
            y: this.y + this.style.height / 2
        };
    };
}

function EdgeView(x1,y1,x2,y2,edge) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.style = new EdgeViewStyle();
    this.edge = edge;
    this.getMiddle = () => {
        return {
            x: (this.x1 + this.x2) / 2,
            y: (this.y1 + this.y2) / 2
        };
    };

    const mid = this.getMiddle();
    this.input = createInput(mid.x, mid.y + 10, this.style);
    this.input.value = this.edge.weight;
    document.getElementById("drawing-area").appendChild(this.input);
    bindInputBlur(this.input, () => { this.edge.setWeight(this.input.value); hideElement(this.input); modelEditor.editEdge(this.edge); });

    this.textPos = { x: mid.x, y: this.input.offsetTop };
    hideElement(this.input);
    

    this.draw = () => {
        drawLine(this.x1, this.y1, this.x2, this.y2, this.style.strokeStyle, ctx);
    };
    this.drawWeight = () => {
        drawText(this.edge.weight, this.textPos.x, this.textPos.y, this.style);
    };
    this.showInput = () => {
        showElement(this.input);
        focusOnReady(this.input);
    };
}

// -----------  -----------//

// ----------- NODE CLASSES -----------//
function Edge(_nodeFrom,_nodeTo,_weight) {
    this.weight = _weight;
    this.nodeFrom = _nodeFrom;
    this.nodeTo = _nodeTo;
    this.setWeight = (_weight) => {
        this.weight = _weight;
        model.updateEdge(this);
    };
}

function Node() {
    this.name = "";
    this.nodeType = "";
    this.attributes = [];
    this.inputs = [];
    this.outputs = [];
    this.setAttribute = (_name, _value) => {
        let attr = this.attributes.find((item) => item.name === _name);
        if (attr) {
            attr.name = _name;
            attr.value = _value;
        } else {
            this.attributes.push({ name: _name, value: _value });
        }
        model.updateNode(this);
    };
    this.getAttribute = (_name) => {
        return this.attributes.find((item) => item.name === _name).value;
    };
    this.setName=(_value)=>{
        this.name = _value;
        model.updateNode(this);
    };
}
// -----------  -----------//


// ----------- MANAGERS -----------//
const model = {
    nodes: [],
    edges: [],
    addNode(_nodeType, _eventArgs) {
        const newNode = new Node();
        newNode.name = defaults.getName(_nodeType);
        newNode.nodeType = _nodeType;
        switch (newNode.nodeType) {
            case NodeTypeEnum.PLACE:
                newNode.attributes = [
                    { name: "Tokens", value: 0 }
                ];
                modelEditor.editPlace(newNode);
                break;
            case NodeTypeEnum.TRANSITION:
                newNode.attributes = [
                    { name: "Fine", value: 0 },
                    { name: "Timedelta", value: 1 }
                ];
                modelEditor.editTransition(newNode);
                break;
        }
        this.nodes.push(newNode);
        canvasManager.addNodeView(_eventArgs.x, _eventArgs.y, newNode);
        modelTree.addNode(newNode);
        
    },
    updateNode(_node) {
        canvasManager.redraw();
        modelTree.updateNode(_node);
    },
    addEdge(_nodeFrom, _nodeTo, _weight, _eventArgs) {
        const newEdge = new Edge(_nodeFrom, _nodeTo, _weight);
        this.edges.push(newEdge);
        _nodeFrom.outputs.push(newEdge);
        _nodeTo.inputs.push(newEdge);
        canvasManager.addEdgeView(newEdge, _eventArgs);
        modelTree.addEdge(newEdge);
        modelEditor.editEdge(newEdge);
    },
    updateEdge(_edge) {
        canvasManager.redraw();
        modelTree.updateEdge(_edge);
    },
    getInputs(_node) {
        return this.edges.filter(edge => edge.nodeTo == _node).map(edge => { return { node: edge.nodeFrom, weight: edge.weight,edge:edge }; });
    },
    getOutputs(_node) {
        return this.edges.filter(edge => edge.nodeFrom == _node).map(edge => { return { node: edge.nodeTo, weight: edge.weight, edge: edge }; });
    },
    checkExistingEdge(nodeFrom, nodeTo) {
        for (let edge of this.edges) {
            if (edge.nodeFrom === nodeFrom && edge.nodeTo === nodeTo) {
                return true;
            }
        }
        return false;
    },
};

const canvasManager = {
    nodeViews: [],
    edgeViews:[],
    addNodeView(x, y, node) {
        let nodeView;
        switch (node.nodeType) {
            case NodeTypeEnum.PLACE:
                nodeView = new PlaceNodeView(x, y, node);
                break;
            case NodeTypeEnum.TRANSITION:
                nodeView = new TransitionNodeView(x, y, node);
                break;
        }
        this.nodeViews.push(nodeView);
        nodeView.draw();
        nodeView.showInput();
    },
    addEdgeView(edge,eventArgs) {
        const mousePos = eventArgs.mousePos;
        const nodeFrom = eventArgs.start;
        const nodeTo = eventArgs.end;
        const pointFrom = nodeFrom.getOutputPoint();
        const pointTo = nodeTo.getInputPoint();

        const edgeView = new EdgeView(pointFrom.x, pointFrom.y, pointTo.x, pointTo.y, edge);
        this.edgeViews.push(edgeView);
        edgeView.draw();
        edgeView.showInput();
    },
    redraw() {
        clearCanvas(canvas);
        for (let nodeView of this.nodeViews) {
            nodeView.draw();
            nodeView.drawName();
        }
        for (let edgeView of this.edgeViews) {
            edgeView.draw();
            edgeView.drawWeight();
        }
    },
    getSelectedNode(x, y) {
        for (let nodeView of this.nodeViews) {
            if (nodeView.checkBoundaries(x, y)) return nodeView;
        }
    }
    
};



const modelTree = {
    treeNodes: [],
    addNode(_node) {
        const treeNode = new TreeNode(_node);
        this.treeNodes.push(treeNode);
    },
    updateNode(_node) {
        const nodeToUpdate = this.treeNodes.find(treeNode => treeNode.node === _node);
        nodeToUpdate.updateNode();
    },
    addEdge(_edge) {
        const nodeFrom = this.treeNodes.find(treeNode => treeNode.node === _edge.nodeFrom);
        const nodeTo = this.treeNodes.find(treeNode => treeNode.node === _edge.nodeTo);
        nodeFrom.addOutput(_edge);
        nodeTo.addInput(_edge);
    },
    updateEdge(_edge) {
        for (let treeNode of this.treeNodes) {
            treeNode.updateEdge(_edge);
        }
    }
};



function TreeNode(node) {
    this.node = node;
    this.inputs = [];
    this.outputs = [];
    const tmpl = document.getElementById("node-template").content.cloneNode(true).querySelector(".node-container");
    const modelContainer = document.getElementById("model-tree");
    tmpl.querySelector('.node-name').innerText = node.name;
    tmpl.querySelector('.node-name').addEventListener("click", (e) => {
        switch (node.nodeType) {
            case NodeTypeEnum.PLACE:
                modelEditor.editPlace(node);
                break;
            case NodeTypeEnum.TRANSITION:
                modelEditor.editTransition(node);
                break;
        }
    });
    this.container = tmpl;
    bindToggle(tmpl.querySelector(".node-content"), tmpl.querySelector(".img-exp-content"));
    bindToggle(tmpl.querySelector(".node-inputs-list-container"), tmpl.querySelector(".img-exp-inputs"));
    bindToggle(tmpl.querySelector(".node-outputs-list-container"), tmpl.querySelector(".img-exp-outputs"));

    modelContainer.appendChild(tmpl);
    this.updateNode = () => {
        this.container.querySelector('.node-name').innerText = this.node.name;
    };
    this.updateEdge = (edge) => {
        for (let input of this.inputs) {
            if (input.edge === edge)
                input.container.querySelector(".list-item-text").innerText = `(${edge.nodeFrom.name} - ${edge.nodeTo.name}) ${edge.weight}`;
        }
        for (let output of this.outputs) {
            if (output.edge === edge)
                output.container.querySelector(".list-item-text").innerText = `(${edge.nodeFrom.name} - ${edge.nodeTo.name}) ${edge.weight}`;
        }
    };
    this.addInput = (edge) => {
        const inputList = this.container.querySelector(".node-inputs-list");
        const listItem = document.getElementById("list-item-template").content.cloneNode(true).querySelector(".list-item");
        this.inputs.push({ edge: edge, container: listItem });
        listItem.addEventListener("click", (e) => {
            modelEditor.editEdge(edge);
        });
        listItem.querySelector(".list-item-text").innerText = `(${edge.nodeFrom.name} - ${edge.nodeTo.name}) ${edge.weight}`;
        inputList.appendChild(listItem);
    };
    this.addOutput = (edge) => {
        const outputsList = this.container.querySelector(".node-outputs-list");
        const listItem = document.getElementById("list-item-template").content.cloneNode(true).querySelector(".list-item");
        this.outputs.push({ edge: edge, container: listItem });
        listItem.addEventListener("click", (e) => {
            modelEditor.editEdge(edge);
        });
        listItem.querySelector(".list-item-text").innerText = `(${edge.nodeFrom.name} - ${edge.nodeTo.name}) ${edge.weight}`;
        outputsList.appendChild(listItem);
    }
}

const modelEditor = {
    editPlace(node) {
        const tmpl = document.getElementById("place-node-editor-template").content.cloneNode(true).querySelector(".node-editor-container");
        tmpl.querySelector(".name").value = node.name;
        const name = tmpl.querySelector(".name");
        bindInputChange(name, () => { node.setName(name.value); });
        tmpl.querySelector(".tokenscount").value = node.getAttribute("Tokens");
        const tokensCount = tmpl.querySelector(".tokenscount");
        bindInputChange(tokensCount, () => { node.setAttribute("Tokens", tokensCount.value); });
        const modelEditor = document.getElementById("model-editor");
        modelEditor.innerHTML = "";
        modelEditor.appendChild(tmpl);

    },
    editTransition(node) {
        const tmpl = document.getElementById("transition-node-editor-template").content.cloneNode(true).querySelector(".node-editor-container");
        tmpl.querySelector(".name").value = node.name;
        const name = tmpl.querySelector(".name");
        bindInputChange(name, () => { node.setName(name.value); });
        tmpl.querySelector(".fine").value = node.getAttribute("Fine");
        const fine = tmpl.querySelector(".fine");
        bindInputChange(fine, () => { node.setAttribute("Fine", fine.value); });
        tmpl.querySelector(".timedelta").value = node.getAttribute("Timedelta");
        const timedelta = tmpl.querySelector(".timedelta");
        bindInputChange(timedelta, () => { node.setAttribute("Timedelta", timedelta.value); });
        const modelEditor = document.getElementById("model-editor");
        modelEditor.innerHTML = "";
        modelEditor.appendChild(tmpl);
    },
    editEdge(edge) {
        const tmpl = document.getElementById("edge-editor-template").content.cloneNode(true).querySelector(".node-editor-container");
        tmpl.querySelector(".weight").value = edge.weight;
        const weight = tmpl.querySelector(".weight");
        bindInputChange(weight, () => { edge.setWeight( weight.value); });
        const modelEditor = document.getElementById("model-editor");
        modelEditor.innerHTML = "";
        modelEditor.appendChild(tmpl);
    },
    clear() {
        const modelEditor = document.getElementById("model-editor");
        modelEditor.innerHTML = "";
    }
}

// -----------  -----------//

// ----------- HELPER FUNCTIONS -----------//

function bindToggle(element, img) {
    img.addEventListener("click", () => {
        if (element.style.display !== "none") {
            img.src = arrowImgPath;
            hideElement(element);
        } else {
            img.src = arrowImgDownPath;
            showElement(element);
        }
    });
    
}

function createInput(x, y, style) {
    const input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.left = x + "px";
    input.style.top = y + "px";
    input.style.minWidth = style.textBoxWidth + "px";
    input.style.maxWidth = style.textBoxWidth + "px";
    return input;
}

function bindInputBlur(input, callback) {
    let defaultValue = input.value;
    const func = () => {
        if (input.value === "") {
            input.value = defaultValue;
        }
        callback();
    };
    input.addEventListener("blur", func);
    input.addEventListener("keydown", (e) => {
        if (e.keyCode === 13)
            func();
    });
}

function bindInputChange(input, callback) {
    let defaultValue = input.value;
    const func = () => {
        if (input.value === "") {
            input.value = defaultValue;
        }
        callback();
    };
    input.addEventListener("change", func);
    input.addEventListener("keydown", (e) => {
        if (e.keyCode === 13)
            func();
    });
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

function hideElement(element) {
    element.style.display = "none";
}

function showElement(element) {
    element.style.display = "block";
}

function drawText(msg, x, y, style) {
    ctx.textBaseline = style.textBaseline;
    ctx.textAlign = style.textAlign;
    ctx.fillStyle = style.textFillStyle;
    ctx.font = style.font;
    ctx.fillText(msg, x, y);
}

function drawEdgePoint(x, y, color, context) {
    context.beginPath();
    context.strokeStyle = color;
    context.arc(x, y, 5, 0, 2 * Math.PI);
    context.stroke();
}

function drawLine(x1, y1, x2, y2,strokeStyle, context) {
    context.beginPath();
    context.strokeStyle = strokeStyle;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

function drawConnection(x1, y1, x2, y2) {
    drawEdgePoint(x1, y1, "blue", ctxEdit);
    drawEdgePoint(x2, y2, "yellow", ctxEdit);
    drawLine(x1, y1, x2, y2, "black", ctxEdit);
}

function fix_dpi(_canvas) {
    let style = {
        height() {
            return getComputedStyle(_canvas).getPropertyValue('height').slice(0, -2);
        },
        width() {
            return getComputedStyle(_canvas).getPropertyValue('width').slice(0, -2);
        }
    };
    _canvas.setAttribute('width', style.width() * dpi);
    _canvas.setAttribute('height', style.height() * dpi);
}
function clearCanvas(_canvas) {
    _ctx = _canvas.getContext("2d");
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
}

function focusOnReady(element) {
    $(document).ready(() => {
        element.setSelectionRange(0, element.value.length);
        element.focus();
    });

}

function getMousePos(e) {
    const drawingArea = document.getElementById("drawing-area");
    return {
        x: e.clientX - drawingArea.offsetLeft + drawingArea.scrollLeft,
        y: e.clientY - drawingArea.offsetTop + drawingArea.scrollTop
    };
}

function raiseError(msg) {
    const errorBox = document.getElementById("error-message");
    errorBox.innerText = msg;
    showElement(errorBox);
    setTimeout(() => { hideElement(errorBox); }, 1000);
}