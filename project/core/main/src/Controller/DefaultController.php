<?php


namespace App\Controller;


use App\Entity\Document\Test;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends AbstractController
{

    public function indexAction(Request $request)
    {
        return $this->render($request->attributes->get('_template'));
    }

    public function testMongoCreateAction(DocumentManager $documentManager)
    {
        $test = new Test();
        $test->setName("aaa");

        $documentManager->persist($test);
        $documentManager->flush();

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