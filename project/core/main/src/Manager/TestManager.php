<?php


namespace App\Manager;


use App\Entity\Document\Test;
use Doctrine\Common\Annotations\AnnotationReader;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Mapping\Factory\ClassMetadataFactory;
use Symfony\Component\Serializer\Mapping\Loader\AnnotationLoader;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;

class TestManager
{

    /**
     * @var DocumentManager
     */
    private $documentManager;

    /**
     * @var Serializer
     */
    private $serializer;

    public function __construct (
        DocumentManager $documentManager
    ) {
        $classMetadataFactory = new ClassMetadataFactory(new AnnotationLoader(new AnnotationReader()));
        $normalizer = new ObjectNormalizer($classMetadataFactory);
        $encoder = new JsonEncoder();
        $this->serializer = new Serializer([$normalizer], [$encoder]);

        $this->documentManager = $documentManager;
    }

    public function storeTest(string $json)
    {
        $test = $this->serializer->deserialize(
            $json,
            Test::class,
            'json'
        );

        $this->documentManager->persist($test);
        $this->documentManager->flush();
    }

}