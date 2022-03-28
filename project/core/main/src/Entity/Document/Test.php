<?php

namespace App\Entity\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as MongoDB;

/**
 *  @MongoDB\Document(collection="test", repositoryClass="App\Repository\Document\TestRepository")
 */
class Test
{

    /**
     * @var string
     * @MongoDB\Id
     */
    private $id;

    /**
     * @var string
     * @MongoDB\Field(type="string")
     */
    private $status;

    /**
     * @var string
     * @MongoDB\Field(type="string")
     */
    private $agent;

    /**
     * @var string
     * @MongoDB\Field(type="string")
     */
    private $gpuModel;

    /**
     * @var string
     * @MongoDB\Field(type="string")
     */
    private $alternative;

    /**
     * @var string
     * @MongoDB\Field(type="string")
     */
    private $name;

    /**
     * @var string|null
     * @MongoDB\Field(type="string", nullable=true)
     */
    private $error;

    /**
     * @var int|null
     * @MongoDB\Field(type="int", nullable=true)
     */
    private $initTime;

    /**
     * @var array|null
     * @MongoDB\Field(type="collection", nullable=true)
     */
    private $cpuHistory;

    /**
     * @var array|null
     * @MongoDB\Field(type="collection", nullable=true)
     */
    private $fpsHistory;

    /**
     * @var array|null
     * @MongoDB\Field(type="collection", nullable=true)
     */
    private $heapMemoryHistory;

    /**
     * @var array|null
     * @MongoDB\Field(type="collection", nullable=true)
     */
    private $vertexHistory;

    /**
     * @var array|null
     * @MongoDB\Field(type="collection", nullable=true)
     */
    private $trianglesHistory;

    /**
     * @var array|null
     * @MongoDB\Field(type="hash", nullable=true)
     */
    private $cpu;

    /**
     * @var array|null
     * @MongoDB\Field(type="hash", nullable=true)
     */
    private $fps;

    /**
     * @var array|null
     * @MongoDB\Field(type="hash", nullable=true)
     */
    private $heap;

    /**
     * @var int|null
     * @MongoDB\Field(type="int", nullable=true)
     */
    private $vertexTotal;

    /**
     * @var int|null
     * @MongoDB\Field(type="int", nullable=true)
     */
    private $trianglesTotal;

    /**
     * @return string
     */
    public function getId(): string
    {
        return $this->id;
    }

    /**
     * @param string $id
     */
    public function setId(string $id): void
    {
        $this->id = $id;
    }

    /**
     * @return string
     */
    public function getStatus(): string
    {
        return $this->status;
    }

    /**
     * @param string $status
     */
    public function setStatus(string $status): void
    {
        $this->status = $status;
    }

    /**
     * @return string
     */
    public function getAgent(): string
    {
        return $this->agent;
    }

    /**
     * @param string $agent
     */
    public function setAgent(string $agent): void
    {
        $this->agent = $agent;
    }

    /**
     * @return string
     */
    public function getGpuModel(): string
    {
        return $this->gpuModel;
    }

    /**
     * @param string $gpuModel
     */
    public function setGpuModel(string $gpuModel): void
    {
        $this->gpuModel = $gpuModel;
    }

    /**
     * @return string
     */
    public function getAlternative(): string
    {
        return $this->alternative;
    }

    /**
     * @param string $alternative
     */
    public function setAlternative(string $alternative): void
    {
        $this->alternative = $alternative;
    }

    /**
     * @return string
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * @param string $name
     */
    public function setName(string $name): void
    {
        $this->name = $name;
    }

    /**
     * @return string|null
     */
    public function getError(): ?string
    {
        return $this->error;
    }

    /**
     * @param string|null $error
     */
    public function setError(?string $error): void
    {
        $this->error = $error;
    }

    /**
     * @return int|null
     */
    public function getInitTime(): ?int
    {
        return $this->initTime;
    }

    /**
     * @param int|null $initTime
     */
    public function setInitTime(?int $initTime): void
    {
        $this->initTime = $initTime;
    }

    /**
     * @return array|null
     */
    public function getCpuHistory(): ?array
    {
        return $this->cpuHistory;
    }

    /**
     * @param array|null $cpuHistory
     */
    public function setCpuHistory(?array $cpuHistory): void
    {
        $this->cpuHistory = $cpuHistory;
    }

    /**
     * @return array|null
     */
    public function getFpsHistory(): ?array
    {
        return $this->fpsHistory;
    }

    /**
     * @param array|null $fpsHistory
     */
    public function setFpsHistory(?array $fpsHistory): void
    {
        $this->fpsHistory = $fpsHistory;
    }

    /**
     * @return array|null
     */
    public function getHeapMemoryHistory(): ?array
    {
        return $this->heapMemoryHistory;
    }

    /**
     * @param array|null $heapMemoryHistory
     */
    public function setHeapMemoryHistory(?array $heapMemoryHistory): void
    {
        $this->heapMemoryHistory = $heapMemoryHistory;
    }

    /**
     * @return array|null
     */
    public function getVertexHistory(): ?array
    {
        return $this->vertexHistory;
    }

    /**
     * @param array|null $vertexHistory
     */
    public function setVertexHistory(?array $vertexHistory): void
    {
        $this->vertexHistory = $vertexHistory;
    }

    /**
     * @return array|null
     */
    public function getTrianglesHistory(): ?array
    {
        return $this->trianglesHistory;
    }

    /**
     * @param array|null $trianglesHistory
     */
    public function setTrianglesHistory(?array $trianglesHistory): void
    {
        $this->trianglesHistory = $trianglesHistory;
    }

    /**
     * @return array|null
     */
    public function getCpu(): ?array
    {
        return $this->cpu;
    }

    /**
     * @param array|null $cpu
     */
    public function setCpu(?array $cpu): void
    {
        $this->cpu = $cpu;
    }

    /**
     * @return array|null
     */
    public function getFps(): ?array
    {
        return $this->fps;
    }

    /**
     * @param array|null $fps
     */
    public function setFps(?array $fps): void
    {
        $this->fps = $fps;
    }

    /**
     * @return array|null
     */
    public function getHeap(): ?array
    {
        return $this->heap;
    }

    /**
     * @param array|null $heap
     */
    public function setHeap(?array $heap): void
    {
        $this->heap = $heap;
    }

    /**
     * @return int|null
     */
    public function getVertexTotal(): ?int
    {
        return $this->vertexTotal;
    }

    /**
     * @param int|null $vertexTotal
     */
    public function setVertexTotal(?int $vertexTotal): void
    {
        $this->vertexTotal = $vertexTotal;
    }

    /**
     * @return int|null
     */
    public function getTrianglesTotal(): ?int
    {
        return $this->trianglesTotal;
    }

    /**
     * @param int|null $trianglesTotal
     */
    public function setTrianglesTotal(?int $trianglesTotal): void
    {
        $this->trianglesTotal = $trianglesTotal;
    }

}