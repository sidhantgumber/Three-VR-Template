import './styles/index.scss';
import * as SceneSetup from './js/utils/sceneSetup';
import * as ReactCube from './js/box/group';
import * as ThreeMeshUI from 'three-mesh-ui';
import ncuLogo from './images/logos/The_NorthCap_University_logo.png';
import FontJSON from '../src/fonts/Roboto-Regular-msdf/Roboto-Regular-msdf.json';
import FontImage from '../src/fonts/Roboto-Regular-msdf/Roboto-Regular.png';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

/* Define DOM elements */
const rootElement = document.querySelector('#root');
const contentElement = document.querySelector('#content-wrapper');

/* Define Three variables */
let camera, controls, scene, renderer, aspectHeight, aspectWidth, gridHelper, textureLoader, loader, controller1, controller2;

console.log("git test");

const objects = [];
const cubes = [];

let raycaster;
let shootRaycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
// let canShoot = false;
let oneShot = true;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

const lightColor = 0xFFFFFF;
const intensity = 2;
const light = new THREE.HemisphereLight(lightColor , intensity);
const light1 = new THREE.DirectionalLight(lightColor , intensity);
const ambientLight = new THREE.AmbientLight( 0x404040 )
const listener = new THREE.AudioListener();
const numberOfCubes = 50;
light.position.set(0, 10, 0);
light1.position.set(0, 10, 0);


light.castShadow = true;

loader = new GLTFLoader().setPath("models1/");
const audioLoader = new THREE.AudioLoader();
const shootingSound = new THREE.Audio(listener);

let isFPS = true;

var reticle;
const imageLoader = new THREE.ImageLoader().setPath('public');
imageLoader.load('reticle.png', function(image){

        reticle = image.scene;
        const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );
		context.drawImage( image, 1000, 1000 )
})


function makePlane(color, xpos, ypos, zpos, xrot, yrot,zrot, hasShadow,scene)
{
const plane = new THREE.Mesh(new THREE.PlaneGeometry(200,200,200,200), new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide}));
plane.rotation.set(xrot,yrot,zrot);
plane.position.set(xpos,ypos,zpos);
plane.receiveShadow = hasShadow
plane.material.side = THREE.DoubleSide;
scene.add(plane);
return plane;
}
const geometry = new THREE.BoxGeometry(4, 4, 4);

// const player = null;

function makeCube(geometry, color, xPosition,yPosition, zPosition, scene)
{
const boxColor = new THREE.Color(color);   
const material = new THREE.MeshBasicMaterial({color: boxColor});
const cube = new THREE.Mesh(geometry,material);
cube.position.x = xPosition;
cube.position.y = yPosition;
cube.position.z = zPosition;
scene.add(cube);
return cube;
}

const sphereGeometry = new THREE.SphereGeometry( 15, 32, 16 );
const material = new THREE.MeshBasicMaterial( { color: 'red'} );
const shootPoint = new THREE.Mesh( sphereGeometry, material );


var gun;
loader.load('gun.glb', function(gltf){

    scene.add(gltf.scene);
    gltf.scene.scale.set(0.05,0.05,0.05);
    gltf.scene.position.set(0,10,0);
    gun = gltf.scene;
    gun.add(shootPoint);
    shootPoint.position.set(16,5.5,0);
    const gunFolder = gui.addFolder('Gun')
    gunFolder.add(gun.position, 'x', )
    gunFolder.add(gun.position, 'y')
    gunFolder.add(gun.position, 'z')
    gunFolder.add(gun.rotation, 'x', )
    gunFolder.add(gun.rotation, 'y')
    gunFolder.add(gun.rotation, 'z')
    gunFolder.open()
    gltf.scene.rotation.set(0,Math.PI/2,0);
    gltf.castShadow = true;
})

var isPicked = false;

console.log(loader);
audioLoader.load('sounds/gunshot.mp3' , function(buffer){
shootingSound.setBuffer(buffer);
shootingSound.setLoop(false);
shootingSound.setVolume(1);
//shootingSound.play();
})


const gui = new GUI()
const shootPointFolder = gui.addFolder('Shoot Point');
shootPointFolder.add(shootPoint.position, 'x', )
shootPointFolder.add(shootPoint.position, 'y')
shootPointFolder.add(shootPoint.position, 'z')


const onResize = () => {
    aspectWidth = window.innerWidth;
    aspectHeight = window.innerHeight - contentElement.getBoundingClientRect().bottom;
    camera.aspect = aspectWidth / aspectHeight;
    camera.updateProjectionMatrix();

    // if(isFPS){
    //     controls.handleResize();
    // }

    renderer.setSize(aspectWidth, aspectHeight);
};



const initThreeJS = async () => {


    aspectWidth = window.innerWidth;
    aspectHeight = window.innerHeight - contentElement.getBoundingClientRect().bottom;

    /* Define camera */
    camera = SceneSetup.camera(aspectWidth, aspectHeight);
    camera.add(listener);

    /* Configurate camera */
    camera.position.set(0, 5, 5.65);

    /* Define scene */
    scene = SceneSetup.scene();
    scene.add(light);
    scene.add(light1);
    scene.add(ambientLight);
    scene.add(shootPoint);
    scene.add(reticle);
    shootPoint.position.set(0,14,0);
    shootPoint.scale.set(0.1,0.1,0.1);
    
    const ground = makePlane('grey',0,8,0, -Math.PI/2,0,0,true,scene);
    const wall1 = makePlane('yellow',100,100,0,0,-Math.PI/2,0,true,scene);
    const wall2 = makePlane('yellow',-100,100,0,0,-Math.PI/2,0,true,scene);
    const wall3 = makePlane('white',0,100,-100,0,0,0,true,scene);
   
    for(let i = 0; i < numberOfCubes; i++)
    {
       cubes.push(makeCube(geometry,0x1FF5F4, THREE.MathUtils.randInt(-90,90), 10, THREE.MathUtils.randInt(-90,90), scene));
    }

    const cameraFolder = gui.addFolder('Camera')
    cameraFolder.add(camera.position, 'x')
    cameraFolder.add(camera.position, 'y')
    cameraFolder.add(camera.position, 'z')
    cameraFolder.open()
    // const roof = makePlane('grey',0,10,0, -Math.PI/2,0,0,true,scene);


    /* Define grid helper */
    gridHelper = SceneSetup.gridHelper(20);

    /* Configurate grid helper */
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;

    /* Add grid helper to scene */
    // scene.add(gridHelper);

    /* Add react cube to scene */
    // scene.add(await ReactCube.group());

    /* Define renderer */
    renderer = SceneSetup.renderer({ antialias: true });

    /* Configure renderer */
    renderer.setSize(aspectWidth, aspectHeight);

    document.body.appendChild(VRButton.createButton(renderer));

    controller1 = SceneSetup.Controller(renderer,scene,0)
    controller2 = SceneSetup.Controller(renderer,scene,1)

    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);

    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);

    // player = new THREE.Mesh(new THREE.PlaneGeometry(00,00,00,00));
    
    /* Define controls */
    controls = SceneSetup.controls(camera, renderer.domElement);

    
const playerGeometry = new THREE.BoxGeometry(0, 0, 0);
const playerMat = new THREE.MeshBasicMaterial();
const player = new THREE.Mesh(playerGeometry,playerMat);

        player.add(camera);
        player.add(controller1);
        player.add(controller2);
        player.position.set(0,12,0);
    
  

    /* Configurate controls */
    
        controls.maxPolarAngle = (0.9 * Math.PI) / 2;
        controls.enableDamping = true;
        controls.dampingFactor = 0.15;

    /* Add event listener on resize */
    window.addEventListener('resize', onResize, false);

    /* Append canvas to DOM */
    rootElement.appendChild(renderer.domElement);

 //   makeTextPanel();
};

function setInputKeys(){

    const onKeyDown = function ( event ) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                console.log(" w pressed");
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;

            case 'Space':
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;

            case 'mousedown' : 
            console.log("mouse clicked")
            break;

        }

    };

    const onKeyUp = function ( event ) {

        switch ( event.code ) {

    
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;

        }

    };

    function onDocumentMouseDown( event ) {

        event.preventDefault();
        
        switch ( event.which ) {
          case 1: // left mouse click
              console.log("mouse clicked"  );
          
            //  canShoot = true;
             if(isPicked)
             {

                 shoot();
                                 
            }

            break;
            
     
        }
      
      }

      function onDocumentMouseUp( event ) {

        event.preventDefault();
        
        switch ( event.which ) {
          case 1: // left mouse click
              console.log("mouse released"  );
            
             // canShoot = false;
            break;
        }
      
      }

    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('mouseup', onDocumentMouseUp);
    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );
}
function onSelectStart()
{
 console.log("button pressed");
}
function onSelectEnd()
{
console.log("button released");
}
function addFloor(){
    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    // floor
    let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    floorGeometry.rotateX( - Math.PI / 2 );
    const floorMaterial = new THREE.MeshBasicMaterial( { color : 'white' , opacity : 0 } );
    // floorMaterial.alphaMap.set(0);
    floorMaterial.transparent = true;

    const floor = new THREE.Mesh( floorGeometry, floorMaterial );
    scene.add( floor );
}

function updateFPS()
{
    const time = performance.now();

    if ( controls.isLocked === true ) {

        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        const intersections = raycaster.intersectObjects( objects, false );

        const onObject = intersections.length > 0;

        const delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

        if ( onObject === true ) {

            velocity.y = Math.max( 0, velocity.y );
            canJump = true;

        }

        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );

        controls.getObject().position.y += ( velocity.y * delta ); // new behavior

        if ( controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;

        }

    }

    prevTime = time;
}
function updateGunPos()
{
    gun.position.set(0.5, -1, -2);
}
function updateGunRot()
{
    gun.rotation.set(0, Math.PI/2,0);
}
const mouse = new THREE.Vector2();

// window.addEventListener('mousemove', (event) =>
// {
//     mouse.x = (event.clientX / sizes.width) * 2 - 1
//     mouse.y = - (event.clientY / sizes.height) * 2 + 1
// });

function shoot()
{

    // if(canShoot)
    // {
        if(shootingSound.isPlaying)
        {
            shootingSound.stop();
        }
        
        shootingSound.play();
        // const shotOrigin = new THREE.Vector3(shootPoint.position);
        // const shotDirection = new THREE.Vector3();
        // gun.getWorldDirection(shotDirection)
        // shotDirection.normalize();
        //shootRaycaster.set(shotOrigin, shotDirection, 100, 100);
        shootRaycaster = new THREE.Raycaster();
        shootRaycaster.setFromCamera(mouse,camera)
        // console.log(shootRaycaster);
        // console.log(shotOrigin)
        // console.log(shotDirection);
        const intersects = shootRaycaster.intersectObjects(cubes);
        if(intersects.length > 0)
        {
            console.log(intersects);
        }
        intersects[0].object.material.color.set('red');

        // if(intersects.length>0)
        // {
        //     for(let i = 0; i<intersects.length; i ++)
        //     {
        //         intersects[i].object.material.color.set('red');
        //     }
           

        // }
        
        scene.add(new THREE.ArrowHelper(shootRaycaster.ray.direction, shootRaycaster.ray.origin, 300, 0xff0000));
        //console.log("dhishkiyaaaon")
    // }
    // else
    // {
    //   //  console.log("no dhishkiyaaaon") 
    // }
}

const animate = () => {
    renderer.setAnimationLoop(animate);
   // const dir = new THREE.Vector3()
   // console.log(camera.getWorldDirection(dir))
    ThreeMeshUI.update();

   
         /* Update controls when damping */
    controls.update();
    
    if(gun && !isPicked)
    {
        //   gun.rotation.y +=0.01;
        if(gun.position.distanceTo(camera.position) < 0.5)
        {
            console.log("picked up");
            camera.add(gun);
            gun.rotation.set(0,0,0);
            updateGunPos();
            updateGunRot();
            isPicked = true;
        }
    }
    // if(isPicked && canShoot)
    // {

    //     shoot();
    //     if(oneShot)
    //     {
    //         canShoot = false; 
    //     }
            
          
    //     }
         /* Render scene */
    renderer.render(scene, camera);
    }
    
/* Run */
initThreeJS().then(() => animate());
