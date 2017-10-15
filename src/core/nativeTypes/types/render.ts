import * as React from "react";
import {Camera, Group, Scene, WebGLRenderer, WebGLRendererParameters} from "three";
import {IHostContext} from "../../renderer/fiberRenderer/createInstance";
import ReactThreeRenderer from "../../renderer/reactThreeRenderer";
import r3rContextSymbol from "../../renderer/utils/r3rContextSymbol";
import {ReactThreeRendererDescriptor} from "../common/ReactThreeRendererDescriptor";
import {
  CameraElementProps,
} from "./objects/perspectiveCamera";
import {SceneElement, SceneElementProps} from "./objects/scene";

interface IElementTest<T, Props> extends React.ReactElement<Props> {
  ref?: React.Ref<T>;
}

interface IRenderProps extends WebGLRendererParameters {
  camera: IElementTest<Camera, CameraElementProps> | Camera | null;
  scene: any | SceneElement | Scene | null;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      render: IThreeElementPropsBase<RenderAction> & IRenderProps;
    }

    interface IElement<T, TypeString extends string, TProps> extends React.ReactElement<TProps> {
      type: string;
      ref: React.Ref<T>;
    }
  }
}

export class RenderAction implements IHostContext {
  private internalCamera: Camera | null;
  private internalScene: Scene | null;

  private renderer: WebGLRenderer | null;

  private group: Group;

  private wrappedSceneRef: React.Ref<Scene> | null;
  private wrappedCameraRef: React.Ref<Camera> | null;

  private sceneRef: React.Ref<Scene> | null;
  private cameraRef: React.Ref<Camera> | null;
  private animationFrameRequest: number;

  constructor() {
    this.group = new Group();
    (this.group as any)[r3rContextSymbol] = this;

    this.renderer = null;

    this.wrappedSceneRef = null;
    this.wrappedCameraRef = null;

    this.regenerateSceneRef(null);
    this.regenerateCameraRef(null);

    this.animationFrameRequest = 0;
  }

  public triggerRender() {
    if (this.animationFrameRequest === 0) {
      this.animationFrameRequest = requestAnimationFrame(this.rafCallback);
    }
  }

  public mountedIntoRenderer(renderer: WebGLRenderer) {
    if (this.renderer === renderer) {
      return;
    }

    if (!(renderer instanceof WebGLRenderer)) {
      console.error(renderer);
      throw new Error("You are trying to add a <render/> into an object that is not a THREEJS renderer.");
    }
    // console.log("mounted");
    this.renderer = renderer;
    // console.log("yep this is my renderer now", renderer);
  }

  public render = () => {
    if (this.renderer === null ||
      this.internalScene === null ||
      this.internalCamera === null) {
      return;
    }

    if (this.renderer === undefined ||
      this.internalScene === undefined ||
      this.internalCamera === undefined) {
      return;
    }

    this.group.updateMatrixWorld(false);

    this.renderer.render(this.internalScene, this.internalCamera);
  }

  public updateProperties(newValue: IRenderProps) {
    const {
      scene,
      camera,
    } = newValue;

    let sceneElementToRender: React.ReactElement<SceneElementProps> | null = null;
    let cameraElementToRender: React.ReactElement<CameraElementProps> | null = null;

    if (scene !== null && scene !== undefined && !(scene instanceof Scene)) {
      // then it must be a react element

      const sceneRefFromElement: React.Ref<Scene> | null = scene.ref == null ? null : scene.ref;

      const originalKey = scene.key == null ? "" : scene.key;

      if (this.wrappedSceneRef !== sceneRefFromElement) {
        this.regenerateSceneRef(sceneRefFromElement);
      }

      sceneElementToRender = React.cloneElement(scene, {
        key: "scene" + originalKey,
        ref: this.sceneRef,
      } as any /* partial props won't match type completely */);
    }

    if (camera !== null && camera !== undefined && !(camera instanceof Camera)) {
      // then it must be a react element
      const cameraRefFromElement: React.Ref<Camera> | null = camera.ref == null ? null : scene.ref;

      const originalKey = camera.key == null ? "" : camera.key;

      if (this.wrappedCameraRef !== cameraRefFromElement) {
        this.regenerateCameraRef(cameraRefFromElement);
      }

      cameraElementToRender = React.cloneElement(camera, {
        key: "camera" + originalKey,
        ref: this.cameraRef,
      } as any /* partial props won't match type completely */);
    }

    ReactThreeRenderer.render([sceneElementToRender, cameraElementToRender], this.group);
  }

  private rafCallback = () => {
    this.render();

    this.animationFrameRequest = 0;
  }

  private regenerateSceneRef(sceneRef: React.Ref<Scene> | null): void {
    let oldWrappedSceneRef = this.wrappedSceneRef;

    this.wrappedSceneRef = sceneRef;

    this.sceneRef = (scene: Scene | null) => {
      if (oldWrappedSceneRef !== null) {
        (oldWrappedSceneRef as any)(null);

        oldWrappedSceneRef = null;
      }

      if (this.wrappedSceneRef !== null) {
        (this.wrappedSceneRef as any)(scene);
      }

      this.internalScene = scene;
    };
  }

  private regenerateCameraRef(cameraRef: React.Ref<Camera> | null): void {
    let oldWrappedCameraRef = this.wrappedCameraRef;

    this.wrappedCameraRef = cameraRef;

    this.cameraRef = (camera: Camera | null) => {
      if (oldWrappedCameraRef !== null) {
        (oldWrappedCameraRef as any)(null);

        oldWrappedCameraRef = null;
      }

      if (this.wrappedCameraRef !== null) {
        (this.wrappedCameraRef as any)(camera);
      }

      this.internalCamera = camera;
    };
  }
}

class RenderDescriptor extends ReactThreeRendererDescriptor<IRenderProps, RenderAction, WebGLRenderer, never> {
  constructor() {
    super();

    this.hasPropGroup(["scene", "camera"], (instance: RenderAction, newValue: IRenderProps) => {
      instance.updateProperties(newValue);
    });
  }

  public createInstance(props: IRenderProps, rootContainerInstance: HTMLCanvasElement): RenderAction {
    const rootContext: IHostContext = (rootContainerInstance as any)[r3rContextSymbol];
    const renderAction = new RenderAction();

    if (rootContext.renderActionFound === undefined) {
      console.error(rootContainerInstance);
      throw new Error("No render action receiver for " + rootContainerInstance);
    }

    rootContext.renderActionFound(renderAction);

    return renderAction;
  }

  protected addedToParent(instance: RenderAction, container: WebGLRenderer): void {
    instance.mountedIntoRenderer(container);
  }

  protected addedToParentBefore(instance: RenderAction, parentInstance: WebGLRenderer, before: any): void {
    this.addedToParent(instance, parentInstance);
  }
}

export default new RenderDescriptor();
