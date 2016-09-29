
var renderer = PIXI.autoDetectRenderer(800, 600);
document.body.appendChild(renderer.view);


var stage = new PIXI.Container();
var spine;
var skeleton;

var controlBones = [
    'back leg controller',
    'front leg controller',
    'back arm controller',
    'front arm controller',
    'head controller',
    'hip controller'
];
var controls = []; //list of red circle shapes that can be dragged to move spine


var radiansToDegrees = 180/Math.PI;

// load spine data
PIXI.loader
    .add('stretchyman', 'assets/stretchyman.json')
    .load(onAssetsLoaded);

function onAssetsLoaded(loader, res) {

    // create a spine boy
    spine = new PIXI.spine.Spine(res.stretchyman.spineData);

    // set the position
    spine.position.x = renderer.width / 2;
    spine.position.y = renderer.height;

    // play animation
    spine.state.setAnimation(0, 'idle', true);

    stage.addChild(spine);

    skeleton = spine.skeleton;

    addControls();

    startLoop();
}

/**
 * add a draggable control circle for each controlBone and setup drag listeners
 */
function addControls() {

    var dragControl = null;

    var onDragStart = function(event) {

        dragControl = event.target;
        dragControl.alpha = 0.5;
    }

    var onDragEnd = function(event) {

        dragControl.alpha = 1;
        dragControl = null;
    }

    var onDragMove = function(event) {

        if (dragControl && event.target === dragControl) {
            var newPosition = event.data.getLocalPosition(dragControl.parent);
            dragControl.position.x = newPosition.x;
            dragControl.position.y = newPosition.y;

            var bone = dragControl['bone'];

            dragBone(bone, dragControl);
            updateRelatedBones();
        }
    }


    for (var i = 0; i < controlBones.length; i++) {

        var control = new PIXI.Graphics();
        control.lineStyle(2, 0xCC0000);
        control.beginFill(0xCC0000, .5);
        control.drawCircle(0, 0, 20);
        control.endFill();

        control.interactive = true;
        control.name = 'control' + i;

        // setup events
        control
            .on('mousedown', onDragStart)
            .on('touchstart', onDragStart)
            .on('mouseup', onDragEnd)
            .on('mouseupoutside', onDragEnd)
            .on('touchend', onDragEnd)
            .on('touchendoutside', onDragEnd)
            .on('mousemove', onDragMove)
            .on('touchmove', onDragMove);

        spine.addChild(control);
        controls.push(control);

        var bone = skeleton.findBone(controlBones[i]);

        control['bone'] = bone;
    }

    updateRelatedBones();
}

/**
 * position the controls to the bones
 */
function positionControls() {
    var control, bone;
    for (var i = 0; i < controls.length; i++) {
        control = controls[i];
        bone = control.bone;
        control.position.set(skeleton.x + bone.worldX, skeleton.y + bone.worldY);
    }
}

var p = new PIXI.Point();

/**
 * update the bone directly attached to the control being moved
 */
function dragBone(bone, control) {

    if (bone.parent !== null) {
        p.set(control.x - skeleton.x, control.y - skeleton.y)
        bone.parent.worldToLocal(p);
    }
    else {
        p.set(control.x - skeleton.x, control.y - skeleton.y);
    }
    bone.x = p.x;
    bone.y = p.y;
}

/**
 * update bones that relate to controls
 */
function updateRelatedBones() {
    center(skeleton.findBone('back leg middle'), skeleton.findBone('back leg 1'), skeleton.findBone('back leg controller'), 65, 1);
    center(skeleton.findBone('front leg middle'), skeleton.findBone('front leg 1'), skeleton.findBone('front leg controller'), 65, 1);
    center(skeleton.findBone('front arm middle'), skeleton.findBone('front arm 1'), skeleton.findBone('front arm controller'), 90, -1);
    center(skeleton.findBone('back arm middle'), skeleton.findBone('back arm 1'), skeleton.findBone('back arm controller'), 90, -1);
    rotate(skeleton.findBone('front arm controller'), skeleton.findBone('front arm elbow'));
    rotate(skeleton.findBone('back arm controller'), skeleton.findBone('back arm elbow'));
    rotateHead();
    positionControls();
}

var p1 = new PIXI.Point();
var p2 = new PIXI.Point();
var kneePos = new PIXI.Point();

/**
 * center the knees and elbows on the limb
 */
function center(middleBone, hipBone, footBone, amount, dir) {

    p1.set(footBone.worldX + skeleton.x, footBone.worldY + skeleton.y);
    p2.set(hipBone.worldX + skeleton.x, hipBone.worldY + skeleton.y);

    p1.x -= p2.x; p1.y -= p2.y; //sub(p2)

    var dist = Math.sqrt(p1.x * p1.x + p1.y * p1.y);

    p2.set(hipBone.worldX + skeleton.x, hipBone.worldY + skeleton.y);

    p1.x *= .5; p1.y *= .5 //scale(0.5)
    p1.x += p2.x; p1.y += p2.y; //add(p2)

    kneePos.set(p1.x, p1.y);

    middleBone.parent.worldToLocal(kneePos);
    middleBone.x = kneePos.x;
    middleBone.y = kneePos.y;
    middleBone.children[0].y = (22 + Math.max(0, amount - dist * 0.3)) * dir;
}

/**
 * rotate the hands to follow the angle of the arms
 */
function rotate(handBone, elbowBone) {

    p1.set(handBone.worldX, handBone.worldY);
    p1.x -= elbowBone.worldX; p1.y -=  elbowBone.worldY; //sub

    var length = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
    if (length) {
        p1.x *= 1/length;
        p1.y *= 1/length;
    }

    var angle = Math.acos(p1.x) * radiansToDegrees + 180;
    if (p1.y < 0) angle = 360 - angle;
    handBone.rotation = - angle;
}


/**
 * rotate the head - NOT WORKING
 */
function rotateHead() {

    var headControl = skeleton.findBone('head controller');
    var hipControl = skeleton.findBone('hip controller');
    var head = skeleton.findBone('head');
    var angle = - Math.atan2(headControl.worldY - hipControl.worldY, headControl.worldX - hipControl.worldX) * radiansToDegrees;
    angle = (angle - 90) * 2.5;
    head.rotation = head.data.rotation + Math.min(90, Math.abs(angle)) * PIXI.utils.sign(angle);
}


/** ========================================
 * ANIMATION LOOP
 */
function startLoop() {
    //animation loop
    requestAnimationFrame(loop);
}

function loop() {
    renderer.render(stage);
    requestAnimationFrame(loop);
}
