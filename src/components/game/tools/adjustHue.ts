import { Color, Object3D } from 'three';

export const adjustHue = (object3D: Object3D, hue: number) => {
  object3D.traverse((child) => {
    if (child.type === 'mesh') {
      const mesh = child;


      // console.log(mesh.material)

      // if (mesh.material) {
      //   // If the object has multiple materials, you might need to iterate over them

      //   if (Array.isArray(mesh.material)) {

      //     mesh.material.forEach((material) => {
      //       if (material.color) {
      //         // Adjust hue here
      //         const newColor = new Color(material.color.getHex());

      //         newColor.setHSL(hue, newColor.getHSL().s, newColor.getHSL().l);
      //         material.color.set(newColor);
      //       }
      //     });
      //   } else {

      //     if (mesh.material.color) {
      //       // Adjust hue here

      //       const newColor = new Color(mesh.material.color.getHex());

      //       newColor.setHSL(hue, newColor.getHSL().s, newColor.getHSL().l);

      //       mesh.material.color.set(newColor);
      //     }
      //   }
      // }
    }
  });
}
