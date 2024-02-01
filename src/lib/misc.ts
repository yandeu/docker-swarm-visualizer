/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { exec } from 'child_process'

import pkg from 'node-os-utils'
const { mem, cpu } = pkg

export const generateId = () => Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)

// node-os-utils: examples
// console.log('cors:', cpu.count(), 'CPU%', await cpu.usage())
// const memory = await mem.used()
// console.log(memory, 'MEM%', ~~((memory.usedMemMb / memory.totalMemMb) * 100))

/** Does obviously not work on Windows. */
export const diskUsage = () => {
  return new Promise((resolve, reject) => {
    exec('df -h', (error, stdout, stderr) => {
      if (error) return resolve({})

      const mountedOnRoot = stdout.split('\n').filter(l => /\s\/$/.test(l))[0]
      const match: any = mountedOnRoot.match(/[0-9]+\.?[0-9]*\S?/gm)

      if (match.length !== 4) return resolve({})

      const result = { Size: match[0], Used: match[1], Available: match[2], Percent: match[3] }

      return resolve(result)
    })
  })
}

export const memUsage = async () => {
  const memory = await mem.used()
  return ~~((memory.usedMemMb / memory.totalMemMb) * 100)
}

export const cpuCount = () => {
  return cpu.count()
}

export const cpuUsage = async () => {
  return await cpu.usage()
}

const NVIDIA = {
  name: 'nvidia-smi --query-gpu=name --format=csv,noheader',
  memClock: 'nvidia-smi --query-gpu=clocks.mem --format=csv,noheader',
  GpuClock: 'nvidia-smi --query-gpu=clocks.gr --format=csv,noheader',
	temp: 'nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader',
	usageGpu: 'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader',
	memoryTotal: 'nvidia-smi --query-gpu=memory.total --format=csv,noheader',
	memoryFree: 'nvidia-smi --query-gpu=memory.free --format=csv,noheader',
	memoryUsed: 'nvidia-smi --query-gpu=memory.used --format=csv,noheader',
	memoryUtilization: 'nvidia-smi --query-gpu=utilization.memory --format=csv,noheader',
	powerDraw: 'nvidia-smi --query-gpu=power.draw --format=csv,noheader',
}

const promiseExec = (command: string) =>
  new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });

export const getName = async (): Promise<string> => {
  try {
  const name = await promiseExec(NVIDIA.name);
  return name.trim();
  } catch (err) {
  return err.message;
  }
};

export const getTemp = async (): Promise<string> => {
  try {
  const temp = await promiseExec(NVIDIA.temp);
  return temp.trim();
  } catch (err) {
  return err.message;
  }
};

export const getUsage = async (): Promise<string> => {
  try {
  const usage = await promiseExec(NVIDIA.usageGpu);
  return usage.trim();
  } catch (err) {
  return err.message;
  }
};

export const getMemoryTotal = async (): Promise<string> => {
  try {
  const memory = await promiseExec(NVIDIA.memoryTotal);
  return memory.trim().replace(/[A-Z]\w+/g, '');
  } catch (err) {
  return err.message;
  }
};

export const getMemoryFree = async (): Promise<string> => {
  try {
  const memory = await promiseExec(NVIDIA.memoryFree);
  return memory.trim().replace(/[A-Z]\w+/g, '');
  } catch (err) {
  return err.message;
  }
};

export const getMemoryUsed = async (): Promise<string> => {
  try {
  const memory = await promiseExec(NVIDIA.memoryUsed);
  return memory.trim().replace(/[A-Z]\w+/g, '');
  } catch (err) {
  return err.message;
  }
};

export const getGpuClock = async (): Promise<string> => {
  try {
  const clock = await promiseExec(NVIDIA.GpuClock);
  return clock.trim().replace(/[A-Z]\w+/g, '');
  } catch (err) {
  return err.message;
  }
};

export const getMemUtil = async (): Promise<string> => {
	try {
	  const memutil = await promiseExec(NVIDIA.memoryUtilization)
		  return memutil.trim()
	  } catch (err) {
		  return err.message
	  }
};

export const getPower = async (): Promise<string> => {
	try {
	  const pow = await promiseExec(NVIDIA.powerDraw)
		  return pow.trim()
	  } catch (err) {
		  return err.message
	  }
};