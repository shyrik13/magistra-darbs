<?php


namespace App\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends AbstractController
{

    public function indexAction(Request $request)
    {
        return $this->render($request->attributes->get('_template'));
    }

}