#pragma once

void ToFTask(void *parametrospv);
bool tof_get_distances_mm(int *frontal, int *esquerdo, int *direito);

// Retorna true quando TODOS os sensores est\u00e3o est\u00e1veis.
// Ponteiros opcionais recebem o status individual de cada sensor.
bool tof_is_stable(bool *frontal_ok, bool *esq_ok, bool *dir_ok);

