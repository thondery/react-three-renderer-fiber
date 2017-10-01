import * as React from "react";
import {PureComponent} from "react";

interface IColorCubeProps {
  rotation: any;
}

// fun to change the color state in React Devtools ;)
class ColorCube extends PureComponent<IColorCubeProps, any> {
  constructor(...args: any[]) {
    super(...args);

    this.state = {
      color: "#00FF00",
    };
  }

  public render() {
    const {
      color,
    } = this.state;

    const {
      rotation,
    } = this.props;

    return (<mesh
      rotation={rotation}
    >
      <boxGeometry
        width={1}
        height={1}
        depth={1}
      />
      <meshBasicMaterial
        color={color}
      />
    </mesh>);
  }

  public componentWillUnmount() {
    console.log("cube unmounting...");
  }
}

export default ColorCube;
