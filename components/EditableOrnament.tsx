import React, { useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrnamentData } from '../types';
import { OrnamentMesh } from './Ornaments';

interface EditableOrnamentProps {
  data: OrnamentData;
  isSelected: boolean;
  editMode: 'translate' | 'rotate';
  onSelect: () => void;
  onDeselect: () => void;
  onUpdate: (updates: Partial<OrnamentData>) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const EditableOrnament: React.FC<EditableOrnamentProps> = ({
  data,
  isSelected,
  editMode,
  onSelect,
  onDeselect,
  onUpdate,
  onDelete,
  disabled,
}) => {
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  // Handle transform changes
  useEffect(() => {
    if (!transformRef.current || !isSelected) return;

    const controls = transformRef.current;

    const handleChange = () => {
      if (!groupRef.current) return;

      const position = groupRef.current.position;
      const rotation = groupRef.current.rotation;

      onUpdate({
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z],
      });
    };

    controls.addEventListener('change', handleChange);

    // Disable orbit controls while dragging
    const handleDraggingChanged = (event: any) => {
      const orbitControls = (gl.domElement as any).__orbitControls;
      if (orbitControls) {
        orbitControls.enabled = !event.value;
      }
    };

    controls.addEventListener('dragging-changed', handleDraggingChanged);

    return () => {
      controls.removeEventListener('change', handleChange);
      controls.removeEventListener('dragging-changed', handleDraggingChanged);
    };
  }, [isSelected, onUpdate, gl]);

  // Set initial position and rotation
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...data.position);
      if (data.rotation) {
        groupRef.current.rotation.set(...data.rotation);
      }
    }
  }, [data.position, data.rotation]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (disabled) return;

    if (isSelected) {
      // Double click to deselect or handle in parent
    } else {
      onSelect();
    }
  };

  const handlePointerMissed = () => {
    if (isSelected) {
      onDeselect();
    }
  };

  return (
    <>
      <group
        ref={groupRef}
        onClick={handleClick}
        onPointerMissed={handlePointerMissed}
      >
        <OrnamentMesh
          data={{ ...data, position: [0, 0, 0], rotation: [0, 0, 0] }}
          isSelected={isSelected}
        />
      </group>

      {isSelected && groupRef.current && (
        <TransformControls
          ref={transformRef}
          object={groupRef.current}
          mode={editMode}
          size={0.6}
          showX
          showY
          showZ
        />
      )}
    </>
  );
};
