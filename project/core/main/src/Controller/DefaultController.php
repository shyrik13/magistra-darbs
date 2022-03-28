<?php


namespace App\Controller;


use App\Entity\Document\Test;
use App\Manager\TestManager;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends AbstractController
{

    /**
     * @var TestManager
     */
    private $testManager;

    public function __construct (
        TestManager $testManager
    ) {
        $this->testManager = $testManager;
    }

    public function indexAction(Request $request)
    {
        return $this->render($request->attributes->get('_template'));
    }

    public function storeResultsAction(Request $request)
    {
        $this->testManager->storeTest($request->getContent());

        return new JsonResponse("ok");
    }

    public function testMongoFindAction(DocumentManager $documentManager)
    {
        $res = $documentManager->getRepository(Test::class)->findAll();

        dump($res);

        throw new \Exception();

        return new JsonResponse($res);
    }

}