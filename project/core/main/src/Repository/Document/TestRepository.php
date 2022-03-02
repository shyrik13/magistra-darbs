<?php


namespace App\Repository\Document;

use App\Entity\Document\Test;
use Doctrine\Bundle\MongoDBBundle\ManagerRegistry;
use Doctrine\Bundle\MongoDBBundle\Repository\ServiceDocumentRepository;

class TestRepository extends ServiceDocumentRepository
{

    public function __construct(ManagerRegistry $managerRegistry)
    {
        parent::__construct($managerRegistry, Test::class);
    }

    public function findByName($name)
    {
        return $this->createQueryBuilder('t')
            ->field('name')->equals($name)
            ->getQuery()
            ->execute()
            ->toArray()
            ;
    }

}