import React from "react";

interface InstructionsPanelProps {
  activity?: {
    id: string;
    title: string;
    description: string;
  };
}

export default function InstructionsPanel({ activity }: InstructionsPanelProps) {
  return (
    <div style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
      {activity ? (
        <>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }}>
            {activity.title}
          </h3>
          <p style={{ margin: 0, opacity: 0.85 }}>
            {activity.description}
          </p>
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            background: "var(--vsc-editor-bg)",
            borderRadius: 6,
            fontSize: 12,
            opacity: 0.75
          }}>
            💡 Las instrucciones detalladas de cada misión aparecen en el panel "Missions"
          </div>
        </>
      ) : (
        <div style={{ opacity: 0.6, fontSize: 12 }}>
          No hay actividad cargada
        </div>
      )}
    </div>
  );
}
