
var renderer = PIXI.autoDetectRenderer(800, 600);
document.body.appendChild(renderer.view);

// create the root of the scene graph
var stage = new PIXI.Container();

console.log(PIXI);

// load spine data
PIXI.loader
    .add('spineboy', 'assets/spineboy.json')
    .load(onAssetsLoaded);

stage.interactive = true;

function onAssetsLoaded(loader, res)
{

    // create a spine boy
    var spineBoy = new PIXI.spine.Spine(res.spineboy.spineData);

    // set the position
    spineBoy.position.x = renderer.width / 2;
    spineBoy.position.y = renderer.height;

    spineBoy.scale.set(1.5);

    // set up the mixes!
    spineBoy.state.data.setMix('walk', 'jump', 0.2);
    spineBoy.state.data.setMix('jump', 'walk', 0.4);

    // play animation
    spineBoy.state.setAnimation(0, 'walk', true);

    stage.addChild(spineBoy);

    stage.on('click', function ()
    {
        spineBoy.state.setAnimation(0, 'jump', false);
        spineBoy.state.addAnimation(0, 'walk', true, 0);
    });
}

requestAnimationFrame(animate);

function animate()
{
    requestAnimationFrame(animate);
    renderer.render(stage);
}
