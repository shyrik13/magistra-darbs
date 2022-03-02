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
     * @MongoDB\Field(type="string")
     */
    private $name;

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
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name): void
    {
        $this->name = $name;
    }

}